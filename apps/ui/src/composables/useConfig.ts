import { computed, ref, readonly, watch } from "vue";
import { useAPI } from "./api";
import { useAgentAvailability } from "./useAgentAvailability";
import type { AppConfig, ConnectionsConfig, FileRepo } from "@pipelab/shared";
import { defaultAppSettings, defaultConnections, defaultFileRepo } from "@pipelab/shared";

interface ConfigSuccess<R> {
  type: "success";
  result: R;
}

interface ConfigFailure {
  type: "error";
  ipcError: string;
}

type ConfigResult<R> = ConfigSuccess<R> | ConfigFailure;

/** Typed access to one persisted config document; `name` only labels logs and errors. */
interface ConfigIO<T> {
  name: string;
  load: () => Promise<ConfigResult<T>>;
  save: (data: T) => Promise<ConfigResult<"ok">>;
  reset: (key: string) => Promise<ConfigResult<"ok">>;
}

function createConfigComposable<T>({ name, ...io }: ConfigIO<T>, defaultValue: T) {
  const api = useAPI();
  const agent = useAgentAvailability();
  const data = ref<T>(defaultValue);
  const status = ref<"idle" | "loading" | "ready" | "error">("idle");
  const error = ref<string>();
  const loaded = computed(() => status.value === "ready");
  const requested = ref(false);
  let loadedPromise: Promise<void> | undefined;
  let requestGeneration = 0;

  watch(
    agent.status,
    (next, previous) => {
      if (next !== "ready") {
        requestGeneration++;
        loadedPromise = undefined;
        if (status.value === "loading") status.value = "idle";
      } else if (previous !== "ready" && status.value === "ready") {
        // Keep the cached value visible, but require a fresh confirmation before saving.
        status.value = "idle";
      }
    },
    { flush: "sync" },
  );

  const load = async (force = false): Promise<void> => {
    requested.value = true;
    if (loadedPromise) {
      return loadedPromise;
    }
    if (status.value === "ready" && !force) return;

    if (!agent.isReady.value || !api.isConnected()) {
      const unavailable = new Error("API is not connected");
      error.value = unavailable.message;
      status.value = "error";
      throw unavailable;
    }

    const generation = ++requestGeneration;
    const request = Promise.resolve().then(async () => {
      if (generation !== requestGeneration) return;
      status.value = "loading";
      error.value = undefined;
      try {
        const result = await io.load();
        if (generation !== requestGeneration || !agent.isReady.value) return;
        if (result.type === "success") {
          const loadedValue = result.result;
          data.value = loadedValue;
          status.value = "ready";
        } else {
          console.error(`[useConfig] failed to load "${name}":`, result.ipcError);
          error.value = result.ipcError;
          status.value = "error";
          throw new Error(result.ipcError);
        }
      } catch (err) {
        if (generation !== requestGeneration) return;
        console.error(`[useConfig] error loading "${name}":`, err);
        error.value = err instanceof Error ? err.message : String(err);
        status.value = "error";
        throw err;
      }
    });
    const promise = request.finally(() => {
      if (generation === requestGeneration && status.value === "loading") {
        status.value = "idle";
      }
      if (loadedPromise === promise) loadedPromise = undefined;
    });
    loadedPromise = promise;

    return loadedPromise;
  };

  const save = async (newValue: T): Promise<void> => {
    if (!agent.isReady.value || !api.isConnected()) {
      const unavailable = new Error("API is not connected");
      error.value = unavailable.message;
      throw unavailable;
    }

    if (!loaded.value) throw new Error(`Cannot save ${name} before loading persisted data`);

    const generation = requestGeneration;
    try {
      const result = await io.save(newValue);
      if (generation !== requestGeneration || !agent.isReady.value) {
        throw new Error("Agent disconnected before the save completed");
      }
      if (result.type === "error") {
        throw new Error(result.ipcError || `Unable to save ${name}`);
      }
      data.value = newValue;
    } catch (err) {
      console.error(`[useConfig] error saving "${name}":`, err);
      throw err;
    }
  };

  const reset = async (key: keyof T): Promise<void> => {
    if (agent.isReady.value && api.isConnected() && loaded.value) {
      try {
        const result = await io.reset(String(key));
        if (result.type === "success") {
          await load(true);
        } else {
          console.error(
            `[useConfig] failed to reset key "${String(key)}" of "${name}":`,
            result.ipcError,
          );
        }
      } catch (err) {
        console.error(`[useConfig] error resetting key "${String(key)}" of "${name}":`, err);
      }
    }
  };

  return {
    data,
    status: readonly(status),
    loaded,
    requested: readonly(requested),
    loading: computed(() => status.value === "loading"),
    error: readonly(error),
    load,
    save,
    reset,
  };
}

export const useSettingsConfig = () => {
  const api = useAPI();
  return createConfigComposable<AppConfig>(
    {
      name: "settings",
      load: () => api.execute("settings:load"),
      save: (data) => api.execute("settings:save", { data }),
      reset: (key) => api.execute("settings:reset", { key }),
    },
    defaultAppSettings,
  );
};

export const useConnectionsConfig = () => {
  const api = useAPI();
  return createConfigComposable<ConnectionsConfig>(
    {
      name: "connections",
      load: () => api.execute("connections:load"),
      save: (data) => api.execute("connections:save", { data }),
      reset: (key) => api.execute("connections:reset", { key }),
    },
    defaultConnections,
  );
};

export const useProjectsConfig = () => {
  const api = useAPI();
  return createConfigComposable<FileRepo>(
    {
      name: "projects",
      load: () => api.execute("projects:load"),
      save: (data) => api.execute("projects:save", { data }),
      reset: (key) => api.execute("projects:reset", { key }),
    },
    defaultFileRepo,
  );
};

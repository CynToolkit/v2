// @vitest-environment jsdom
import { createApp, defineComponent, h, nextTick, type App } from "vue";
import PrimeVue from "primevue/config";
import Tooltip from "primevue/tooltip";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RELEASE_CONFIG_VERSION, type ReleaseCatalog, type ReleaseConfig } from "@pipelab/shared";
import NotificationTargets from "./NotificationTargets.vue";

vi.mock("../composables/api", () => ({ useAPI: () => ({ execute: vi.fn() }) }));
vi.mock("../store/app", () => ({ useAppStore: () => ({ providerDefinitions: [] }) }));
vi.mock("../store/connections", () => ({
  useConnectionsStore: () => ({
    connections: { version: "1.0.0", connections: [] },
    status: "ready",
    updateConnections: vi.fn(),
    load: vi.fn(),
  }),
}));

const flow: ReleaseConfig = {
  version: RELEASE_CONFIG_VERSION,
  id: "workflow",
  project: "project",
  name: "Game",
  source: { provider: "@pipelab/plugin-construct/source", config: {} },
  builds: [],
  destinations: [],
};

// A catalog with a notification definition makes `find` run its callback, which is where an
// unguarded `editing.value!` used to throw while nothing was being edited.
const catalog: ReleaseCatalog = {
  buildTypes: [],
  sources: [],
  producers: [],
  destinations: [],
  notifications: [
    { id: "@pipelab/plugin-discord/notification", label: "Discord", defaultConfig: {} },
  ],
};

const mountedApps: App[] = [];

afterEach(() => {
  while (mountedApps.length) mountedApps.pop()?.unmount();
});

describe("NotificationTargets", () => {
  it("renders when no notification is being edited", async () => {
    const errors: unknown[] = [];
    const root = document.createElement("div");
    const app = createApp(
      defineComponent({ render: () => h(NotificationTargets, { flow, catalog }) }),
    );
    app.config.errorHandler = (error) => errors.push(error);
    app.use(PrimeVue);
    app.directive("tooltip", Tooltip);
    app.mount(root);
    mountedApps.push(app);
    await nextTick();

    expect(errors).toEqual([]);
    expect(root.textContent).toContain("Add notification");
  });
});

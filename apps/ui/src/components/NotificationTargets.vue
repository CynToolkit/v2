<template>
  <section class="release-section">
    <div class="section-heading">
      <div>
        <h2>
          Notifications<span v-if="targets.length" class="section-count">{{ targets.length }}</span>
        </h2>
      </div>
      <div class="section-actions">
        <Button
          label="Add notification"
          icon="pi pi-plus"
          outlined
          size="small"
          severity="secondary"
          @click="addVisible = true"
        />
      </div>
    </div>
    <div v-if="!targets.length" class="empty-card">
      <i class="mdi mdi-bell-outline" /><strong>No notifications yet</strong>
      <span>Announce finished runs to a chat channel or webhook, from the app or the CLI.</span>
    </div>
    <article
      v-for="(target, index) in targets"
      :key="target.id"
      class="job-card"
      :class="{ disabled: !target.enabled, invalid: missingFields(index).length }"
    >
      <div class="job-header">
        <ToggleSwitch
          class="row-switch"
          :model-value="target.enabled"
          v-tooltip.top="target.enabled ? 'Pause this notification' : 'Enable this notification'"
          :aria-label="`Enable ${titleFor(target)}`"
          @update:model-value="target.enabled = Boolean($event)"
        />
        <div class="provider-icon">
          <ServiceIcon
            :icon="definitionFor(target)?.icon"
            fallback="mdi mdi-bell-outline"
            size="lg"
          />
        </div>
        <div class="job-title">
          <strong>{{ titleFor(target) }}</strong
          ><span>{{ summaryFor(target) }}</span>
        </div>
        <ReleaseStatus
          :label="
            !target.enabled ? 'Disabled' : missingFields(index).length ? 'Needs attention' : 'Ready'
          "
        />
        <Button
          text
          rounded
          size="small"
          severity="secondary"
          icon="pi pi-pencil"
          v-tooltip.top="'Edit notification settings'"
          :aria-label="`Edit ${titleFor(target)}`"
          @click="editingId = target.id"
        />
      </div>
    </article>
  </section>

  <Dialog
    v-model:visible="addVisible"
    class="pl-dialog"
    modal
    header="Add notification"
    :style="{ width: '480px', maxWidth: '94vw' }"
  >
    <div class="target-add">
      <button
        v-for="definition in catalog.notifications ?? []"
        :key="definition.id"
        type="button"
        class="target-pick"
        @click="add(definition.id)"
      >
        <span class="provider-icon">
          <ServiceIcon :icon="definition.icon" fallback="mdi mdi-bell-outline" size="lg" />
        </span>
        <span class="target-pick-copy">
          <strong>{{ definition.label }}</strong>
          <small>{{ definition.description }}</small>
        </span>
        <i class="pi pi-chevron-right" aria-hidden="true" />
      </button>
    </div>
    <template #footer><Button label="Cancel" text @click="addVisible = false" /></template>
  </Dialog>

  <Dialog
    v-model:visible="editVisible"
    class="pl-dialog"
    modal
    :style="{ width: '640px', maxWidth: '94vw' }"
  >
    <template #header>
      <span class="dialog-title">
        <ServiceIcon
          v-if="editing"
          :icon="definitionFor(editing)?.icon"
          fallback="mdi mdi-bell-outline"
          size="lg"
        />
        Edit notification
      </span>
    </template>
    <Message v-if="error" severity="error" role="alert">{{ error }}</Message>
    <div v-if="editing" class="edit-body">
      <InputText
        :id="`${editing.id}-name`"
        class="edit-title"
        :model-value="editing.name ?? ''"
        placeholder="Name this notification (optional)"
        aria-label="Name"
        autocomplete="off"
        @update:model-value="editing.name = String($event ?? '') || undefined"
      />
      <ol class="steps">
        <li class="step">
          <span class="step-node" aria-hidden="true"><i class="pi pi-bolt" /></span>
          <div class="step-body">
            <h3><span>If</span> any of these happens</h3>
            <NotificationTriggerPicker :target="editing" :destinations="destinationChoices" />
            <p class="step-hint">Run events also follow the switches in workflow settings.</p>
          </div>
        </li>
        <li class="step">
          <span class="step-node" aria-hidden="true"
            ><ServiceIcon
              :icon="definitionFor(editing)?.icon"
              fallback="mdi mdi-bell-outline"
              size="sm"
          /></span>
          <div class="step-body">
            <h3><span>Then</span> notify {{ definitionFor(editing)?.label ?? "a channel" }}</h3>
            <template v-for="field in definitionFor(editing)?.fields ?? []" :key="field.key">
              <ReleaseFieldControl
                v-if="field.key !== 'template'"
                :field="field"
                :value="fieldValue(editing, field.key)"
                :options="optionsFor(field)"
                :input-id="`${editing.id}-${field.key}`"
                :connection-binding="bindingFor(fieldValue(editing, field.key))"
                :connection-binding-suggestion="
                  suggestionFor(fieldValue(editing, field.key), field)
                "
                :issues="
                  field.type === 'connection' ? [] : issuesFor(targets.indexOf(editing), field.key)
                "
                hide-advanced
                @update:value="setField(editing, field.key, $event)"
                @update:connection-binding="bind(editing, field, $event)"
                @add-connection="openConnection($event, editing, field)"
              />
            </template>
            <div v-if="testableConnection" class="test-row">
              <Button
                label="Send test message"
                icon="pi pi-send"
                size="small"
                severity="secondary"
                outlined
                :loading="testing"
                :disabled="testing"
                @click="sendTest"
              />
              <small v-if="testResult" :class="`test-${testResult.status}`" role="status">
                {{ testMessage }}
              </small>
              <small v-else class="test-hint">Posts a short test message to the channel.</small>
            </div>
            <NotificationTemplateEditor
              :model-value="fieldValue(editing, 'template')"
              :variables="variableInfos"
              :max-length="templateField?.maxLength"
              :default-value="String(definitionFor(editing)?.defaultConfig?.template ?? '')"
              @update:model-value="setField(editing, 'template', $event)"
            />
          </div>
        </li>
      </ol>
    </div>
    <template #footer>
      <Button
        label="Remove"
        icon="pi pi-trash"
        text
        severity="danger"
        @click="editing && remove(targets.indexOf(editing))"
      />
      <Button label="Done" @click="editingId = undefined" />
    </template>
  </Dialog>

  <Dialog
    v-model:visible="connectionVisible"
    class="pl-dialog"
    modal
    header="Add connection"
    :style="{ width: '560px', maxWidth: '94vw' }"
  >
    <div class="settings-grid">
      <div class="release-field">
        <label for="notification-connection-name">Name</label>
        <InputText
          id="notification-connection-name"
          v-model="connectionDraft.name"
          placeholder="Team channel"
        />
      </div>
      <div v-for="field in connectionFields" :key="field.key" class="release-field">
        <label :for="`notification-connection-${field.key}`">{{ field.label }}</label>
        <InputText
          :id="`notification-connection-${field.key}`"
          v-model="connectionDraft.values[field.key]"
          :type="field.type === 'password' ? 'password' : 'text'"
          :placeholder="field.placeholder || 'Stored securely'"
        />
      </div>
    </div>
    <template #footer>
      <Button label="Cancel" text @click="connectionVisible = false" />
      <Button
        label="Add connection"
        :loading="connectionSaving"
        :disabled="!connectionDraft.name.trim() || !connectionHasValue"
        @click="createConnection"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, toRaw, watch } from "vue";
import { nanoid } from "nanoid";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import ToggleSwitch from "primevue/toggleswitch";
import type {
  PreflightResult,
  BuildHistoryEntry,
  ReleaseCatalog,
  ReleaseConfig,
  ReleaseFieldDefinition,
  ReleaseNotificationConfig,
  ValidationIssue,
} from "@pipelab/shared";
import ReleaseFieldControl from "./ReleaseFieldControl.vue";
import NotificationTemplateEditor from "./NotificationTemplateEditor.vue";
import NotificationTriggerPicker from "./NotificationTriggerPicker.vue";
import ReleaseStatus from "./ReleaseStatus.vue";
import ServiceIcon from "./ServiceIcon.vue";
import { useAPI } from "../composables/api";
import { useAppStore } from "../store/app";
import { useConnectionsStore } from "../store/connections";
import { notificationVariableInfos } from "../utils/notification-template";
import { destinationIcon } from "../utils/provider-icons";
import { summarizeTriggers } from "../utils/notification-triggers";
import {
  connectionDraftForIntegration,
  connectionFieldsForIntegration,
  connectionOptionsForIntegration,
  releaseDestinationLabel,
  releaseWorkflowConnectionAliases,
  resolveFieldConnectionAlias,
  setWorkflowConnectionBinding,
  suggestUniqueConnectionBinding,
  suggestWorkflowConnectionAlias,
  workflowConnectionBindingValue,
} from "../utils/release-connection-bindings";

const props = defineProps<{
  flow: ReleaseConfig;
  catalog: ReleaseCatalog;
  projectId?: string;
}>();

const api = useAPI();
const appStore = useAppStore();
const connectionsStore = useConnectionsStore();
const error = ref("");

const addVisible = ref(false);
const latestRun = ref<BuildHistoryEntry>();
const variableInfos = computed(() =>
  notificationVariableInfos(latestRun.value, {
    workflow: props.flow.name || "My game",
    version: "1.0.0",
    destinations: props.flow.destinations
      .filter((destination) => destination.enabled)
      .map((destination) => destinationName(destination.id)),
  }),
);
const destinationChoices = computed(() =>
  props.flow.destinations.map((destination) => ({
    id: destination.id,
    label: destinationName(destination.id),
    icon: destinationIcon(
      appStore.providerDefinitions,
      destination.provider,
      props.catalog.destinations.find((item) => item.id === destination.provider)?.icon,
    ),
  })),
);
/** Best effort: without history the editor still works, hovers just have no value to show. */
const loadLatestRun = async () => {
  if (!props.projectId) return;
  try {
    const result = await api.execute("build-history:get-all", {
      query: { workflowId: props.flow.id, projectId: props.projectId },
    });
    if (result.type !== "success") return;
    latestRun.value = result.result.entries
      .filter((entry) => entry.workflowId === props.flow.id && entry.status !== "running")
      .sort((a, b) => b.startTime - a.startTime)[0];
  } catch {
    latestRun.value = undefined;
  }
};
const editingId = ref<string>();
watch(
  () => editingId.value,
  (id) => {
    if (id) void loadLatestRun();
  },
);
const editing = computed(() => targets.value.find((target) => target.id === editingId.value));
const editVisible = computed({
  get: () => Boolean(editing.value),
  set: (visible) => {
    if (!visible) editingId.value = undefined;
  },
});
const titleFor = (target: ReleaseNotificationConfig) =>
  target.name || definitionFor(target)?.label || target.provider;
const destinationName = (id: string) => {
  const destination = props.flow.destinations.find((candidate) => candidate.id === id);
  if (!destination) return id;
  return releaseDestinationLabel(
    props.catalog.destinations.find((item) => item.id === destination.provider)?.label ||
      destination.provider,
    destination,
    props.flow.destinations,
  );
};
const summaryFor = (target: ReleaseNotificationConfig) =>
  summarizeTriggers(target, destinationName);
const missingFields = (index: number) => [
  ...(definitionFor(targets.value[index]!)?.fields ?? []).flatMap((field) =>
    issuesFor(index, field.key),
  ),
  ...(targets.value[index]!.triggers?.length === 0 ? [{ message: "Choose an event." }] : []),
];

const targets = computed(() => props.flow.notifications ?? []);
const definitionFor = (target: ReleaseNotificationConfig) =>
  props.catalog.notifications?.find((definition) => definition.id === target.provider);
const fieldValue = (target: ReleaseNotificationConfig, key: string) =>
  String(target.config[key] ?? "");
const setField = (target: ReleaseNotificationConfig, key: string, value: unknown) => {
  target.config[key] = String(value ?? "");
};
/** What a run would reject, so a gap shows here instead of in a failed Ship. */
const issuesFor = (index: number, key: string): ValidationIssue[] => {
  const target = targets.value[index];
  if (!target || !target.enabled || fieldValue(target, key)) return [];
  const field = definitionFor(target)?.fields?.find((candidate) => candidate.key === key);
  return field?.required
    ? [
        {
          code: "notifications.required",
          message: `${field.label} is required.`,
          severity: "error",
          path: `notifications.${index}.config.${key}`,
        },
      ]
    : [];
};

const add = (definitionId: string) => {
  const definition = props.catalog.notifications?.find(
    (candidate) => candidate.id === definitionId,
  );
  if (!definition) return;
  props.flow.notifications = [
    ...(props.flow.notifications ?? []),
    {
      id: nanoid(),
      provider: definition.id,
      enabled: true,
      config: structuredClone(toRaw(definition.defaultConfig)),
    },
  ];
  addVisible.value = false;
  editingId.value = props.flow.notifications.at(-1)?.id;
};
const remove = (index: number) => {
  props.flow.notifications = targets.value.filter((_, position) => position !== index);
  editingId.value = undefined;
};

const connections = computed(() => connectionsStore.connections?.connections ?? []);
const connectionsConfig = computed(
  () => connectionsStore.connections ?? { version: "1.0.0" as const, connections: [] },
);
const optionsFor = (field: ReleaseFieldDefinition) =>
  field.type === "connection"
    ? connectionOptionsForIntegration(connections.value, field.integration)
    : (field.options ?? []);
const bindingFor = (alias: string) =>
  workflowConnectionBindingValue(connectionsConfig.value, props.flow.id, alias);
const suggestionFor = (alias: string, field: ReleaseFieldDefinition) =>
  alias
    ? suggestUniqueConnectionBinding(connections.value, field.integration, bindingFor(alias))
    : undefined;

const bind = async (
  target: ReleaseNotificationConfig,
  field: ReleaseFieldDefinition,
  connectionId: string,
) => {
  if (connectionsStore.status !== "ready") return;
  let alias = fieldValue(target, field.key);
  if (!alias && connectionId) {
    alias = suggestWorkflowConnectionAlias(
      definitionFor(target)?.label ?? field.label,
      releaseWorkflowConnectionAliases(props.flow, props.catalog),
    );
    setField(target, field.key, alias);
  }
  if (!alias) return;
  try {
    await connectionsStore.updateConnections({
      ...connectionsConfig.value,
      workflowBindings: setWorkflowConnectionBinding(
        connectionsConfig.value.workflowBindings,
        props.flow.id,
        alias,
        connectionId,
      ),
    });
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Unable to remember this Connection.";
  }
};

const templateField = computed(() =>
  definitionFor(editing.value!)?.fields?.find((field) => field.key === "template"),
);
const webhookField = computed(() =>
  definitionFor(editing.value!)?.fields?.find((field) => field.type === "connection"),
);
const boundConnection = computed(() => {
  const field = webhookField.value;
  if (!editing.value || !field) return undefined;
  const id = bindingFor(fieldValue(editing.value, field.key));
  return connections.value.find((connection) => connection.id === id);
});
const testableConnection = computed(() => !!boundConnection.value);
const testing = ref(false);
const testResult = ref<PreflightResult>();
const testMessage = computed(() => {
  const result = testResult.value;
  if (!result) return "";
  return result.status === "verified"
    ? "Test message sent."
    : result.status === "failed"
      ? result.message
      : result.reason;
});
watch([editingId, boundConnection], () => (testResult.value = undefined));
const sendTest = async () => {
  const connection = boundConnection.value;
  if (!connection || testing.value) return;
  testing.value = true;
  try {
    const values: Record<string, string> = {};
    for (const field of connectionFieldsForIntegration(
      connection.integrationName || connection.pluginName,
      appStore.providerDefinitions,
    )) {
      const value = (connection as Record<string, unknown>)[field.key];
      if (typeof value === "string") values[field.key] = value;
    }
    const response = await api.execute("connection:test", {
      pluginName: connection.pluginName,
      values,
    });
    testResult.value =
      response.type === "error"
        ? { status: "unverifiable", reason: "The test could not be sent." }
        : response.result;
  } catch {
    testResult.value = { status: "unverifiable", reason: "The test could not be sent." };
  } finally {
    testing.value = false;
  }
};

const connectionVisible = ref(false);
const connectionSaving = ref(false);
const connectionDraft = ref({
  name: "",
  integration: "",
  integrationName: "",
  values: {} as Record<string, string>,
});
let pending: { target: ReleaseNotificationConfig; field: ReleaseFieldDefinition } | undefined;
const connectionFields = computed(() => {
  try {
    return connectionFieldsForIntegration(
      connectionDraft.value.integrationName || connectionDraft.value.integration,
      appStore.providerDefinitions,
    );
  } catch {
    return [];
  }
});
const connectionHasValue = computed(() =>
  connectionFields.value.some((field) => connectionDraft.value.values[field.key]?.trim()),
);
const openConnection = (
  integration: string,
  target: ReleaseNotificationConfig,
  field: ReleaseFieldDefinition,
) => {
  pending = { target, field };
  try {
    connectionDraft.value = {
      name: "",
      ...connectionDraftForIntegration(integration, appStore.providerDefinitions),
    };
    error.value = "";
    connectionVisible.value = true;
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Provider Connection schema is unavailable.";
  }
};
const createConnection = async () => {
  if (!connectionHasValue.value || connectionsStore.status !== "ready") return;
  const started = pending;
  connectionSaving.value = true;
  try {
    const record = {
      id: nanoid(),
      pluginName: connectionDraft.value.integration,
      integrationName: connectionDraft.value.integrationName || undefined,
      name: connectionDraft.value.name.trim(),
      ...Object.fromEntries(
        Object.entries(connectionDraft.value.values).map(([key, value]) => [key, value.trim()]),
      ),
      createdAt: new Date().toISOString(),
      isDefault: false,
    };
    let workflowBindings = connectionsConfig.value.workflowBindings ?? [];
    let alias: string | undefined;
    if (started) {
      alias = resolveFieldConnectionAlias(
        fieldValue(started.target, started.field.key),
        started.field.label || started.field.key,
        connections.value.map((connection) => connection.id),
        releaseWorkflowConnectionAliases(props.flow, props.catalog),
      );
      workflowBindings = setWorkflowConnectionBinding(
        workflowBindings,
        props.flow.id,
        alias,
        record.id,
      );
    }
    const result = await api.execute("connections:save", {
      data: {
        ...connectionsConfig.value,
        connections: [...connections.value, record],
        workflowBindings,
      },
    });
    if (result.type === "error") {
      error.value = result.ipcError;
      return;
    }
    await connectionsStore.load(true);
    if (started && alias) setField(started.target, started.field.key, alias);
    pending = undefined;
    connectionVisible.value = false;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Unable to save connection.";
  } finally {
    connectionSaving.value = false;
  }
};
</script>

<style scoped>
.release-section {
  display: grid;
  gap: 0;
}
.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin: 0 0 12px;
}
.section-heading h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  letter-spacing: -0.015em;
}
.section-count {
  min-width: 1.35rem;
  padding: 1px 7px;
  border-radius: 999px;
  color: var(--pl-muted);
  background: var(--pl-hover);
  font-size: 0.72rem;
  font-weight: 600;
  text-align: center;
}
.section-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.job-card,
.empty-card {
  border: 1px solid var(--pl-border);
  border-radius: var(--pl-radius);
  background: var(--pl-card);
  box-shadow: var(--pl-shadow-xs);
}
.job-card {
  overflow: hidden;
  transition:
    border-color 0.15s var(--pl-ease),
    box-shadow 0.2s var(--pl-ease);
}
.job-card:hover {
  border-color: var(--pl-border-strong);
  box-shadow: var(--pl-shadow-sm);
}
.job-card + .job-card {
  margin-top: 8px;
}
.job-card.disabled .job-header {
  opacity: 0.6;
}
.job-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px 12px 16px;
}
.job-title {
  display: grid;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.job-title strong {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.job-title span {
  overflow: hidden;
  color: var(--pl-muted);
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.provider-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border: 1px solid var(--pl-border);
  border-radius: 11px;
  color: var(--pl-accent);
  background: var(--pl-card);
  box-shadow: var(--pl-shadow-xs);
  font-size: 18px;
}
.row-switch {
  flex: 0 0 auto;
  transform: scale(0.72);
  transform-origin: center;
}
.empty-card {
  display: grid;
  place-items: center;
  gap: 6px;
  padding: 36px;
  border-style: dashed;
  box-shadow: none;
  color: var(--pl-muted);
  text-align: center;
}
.empty-card i {
  color: var(--pl-accent);
  font-size: 26px;
}
.settings-grid {
  display: grid;
  gap: 20px;
}
.settings-grid :deep(.release-field),
.edit-body :deep(.release-field) {
  display: grid;
  gap: 7px;
  min-width: 0;
}
.settings-grid :deep(.release-field > label),
.edit-body :deep(.release-field > label) {
  color: var(--p-text-color);
  font-size: 0.78rem;
  font-weight: 600;
}
.settings-grid :deep(.release-field > small),
.edit-body :deep(.release-field > small) {
  color: var(--pl-muted);
  font-size: 0.74rem;
  line-height: 1.4;
}
.settings-grid :deep(textarea) {
  width: 100%;
}
.edit-body {
  display: grid;
  gap: 20px;
}
.edit-title {
  width: 100%;
  font-size: 1rem;
  font-weight: 600;
}
.steps {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}
.step {
  position: relative;
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr);
  gap: 14px;
  padding-bottom: 26px;
}
.step:last-child {
  padding-bottom: 0;
}
/* The rail joining the two steps. */
.step:not(:last-child)::before {
  content: "";
  position: absolute;
  top: 2.2rem;
  bottom: 0.3rem;
  left: calc(1rem - 0.5px);
  width: 1px;
  background: var(--pl-border);
}
.step-node {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--pl-border);
  border-radius: 50%;
  background: var(--pl-sunken);
  color: var(--p-text-color);
  font-size: 0.8rem;
}
.step-body {
  display: grid;
  gap: 14px;
  min-width: 0;
}
.step-body h3 {
  margin: 0;
  min-height: 2rem;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--pl-muted);
  font-size: 0.9rem;
  font-weight: 500;
}
.step-body h3 span {
  color: var(--p-text-color);
  font-weight: 700;
}
.test-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.test-row small {
  font-size: 0.74rem;
  color: var(--pl-muted);
}
.test-row .test-verified {
  color: var(--p-green-600, #16a34a);
}
.test-row .test-failed {
  color: var(--p-message-error-color, var(--p-red-600, #dc2626));
}
.step-hint {
  margin: -6px 0 0;
  color: var(--pl-muted);
  font-size: 0.74rem;
}
.target-add {
  display: grid;
  gap: 8px;
}
.target-pick {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--pl-border);
  border-radius: var(--pl-radius);
  background: var(--pl-card);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s var(--pl-ease),
    box-shadow 0.2s var(--pl-ease);
}
.target-pick:hover {
  border-color: var(--pl-border-strong);
  box-shadow: var(--pl-shadow-sm);
}
.target-pick:focus-visible {
  outline: 1px solid var(--p-primary-color);
  outline-offset: 2px;
}
.target-pick-copy {
  display: grid;
  flex: 1;
  gap: 2px;
  min-width: 0;
}
.target-pick-copy strong {
  font-size: 0.9rem;
  font-weight: 600;
}
.target-pick-copy small {
  color: var(--pl-muted);
  font-size: 0.78rem;
}
.target-pick .pi-chevron-right {
  color: var(--pl-muted);
  font-size: 0.75rem;
}
.dialog-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
</style>

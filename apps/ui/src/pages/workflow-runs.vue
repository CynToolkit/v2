<template>
  <div class="workflow-page">
    <main class="runs-page" :aria-busy="loading">
      <div class="list-heading">
        <WorkflowRunsSwitch :flow-id="flowId" :project-id="projectId" active="runs" />
        <span v-if="!loading && !historyError && !workflowError" class="run-count"
          >{{ entries.length }} {{ entries.length === 1 ? "run" : "runs" }}</span
        >
      </div>
      <Message v-if="workflowError" severity="error" :closable="false" role="alert">
        <div class="state-copy">
          <strong>Couldn’t load workflow</strong><span>{{ workflowError }}</span
          ><Button label="Try again" text size="small" @click="loadRuns" />
        </div>
      </Message>
      <Message v-if="historyError" severity="error" :closable="false" role="alert">
        <div class="state-copy">
          <strong>Couldn’t load run history</strong><span>{{ historyError }}</span
          ><Button label="Try again" text size="small" @click="loadRuns" />
        </div>
      </Message>
      <p v-if="!agent.isReady.value && !entries.length" class="inline-state" role="status">
        Run history is unavailable while the engine is disconnected.
      </p>
      <div
        v-else-if="loading && !entries.length"
        class="history-skeleton"
        aria-busy="true"
        aria-label="Loading runs"
      >
        <div v-for="n in 4" :key="n" class="skeleton-row"><span /><span /><span /></div>
      </div>
      <div
        v-else-if="!loading && !historyError && !workflowError && !entries.length"
        class="empty-state"
        role="status"
      >
        <i class="mdi mdi-rocket-launch-outline" aria-hidden="true" />
        <strong>No runs yet</strong
        ><span>Ship this workflow to see its execution history here.</span>
        <Button
          label="Configure workflow"
          icon="pi pi-arrow-left"
          text
          @click="router.push(basePath)"
        />
      </div>
      <div
        v-else-if="!loading && entries.length"
        class="run-list"
        role="list"
        aria-label="Workflow runs"
      >
        <div v-for="entry in entries" :key="entry.id" role="listitem">
          <button
            type="button"
            class="run-row"
            :class="{ 'is-running': entry.status === 'running' }"
            @click="openRun(entry)"
          >
            <span
              class="status-mark"
              :class="`status-${entry.status}`"
              role="img"
              :aria-label="statusLabel(entry.status)"
            >
              <i :class="statusIcon(entry.status)" aria-hidden="true" />
            </span>
            <span class="run-main">
              <strong>{{
                entry.version
                  ? `Release ${entry.version}`
                  : entry.workflowName || entry.projectName || "Workflow run"
              }}</strong>
              <small
                ><span class="run-id">#{{ shortId(entry.id) }}</span
                ><span>{{ entry.workflowName || entry.projectName }}</span></small
              >
            </span>
            <span class="run-time"
              ><strong>{{ formatDate(entry.startTime) }}</strong
              ><small>{{ formatTime(entry.startTime) }}</small></span
            >
            <span class="run-duration">{{ formatDuration(entry) }}</span>
            <span class="run-summary"
              ><strong>{{ entry.completedSteps }}/{{ entry.totalSteps }} steps</strong
              ><small
                >{{ entry.artifacts?.length || 0 }} artifacts ·
                {{ entry.deliveries?.length || 0 }} deliveries</small
              ></span
            >
            <i class="mdi mdi-chevron-right row-chevron" aria-hidden="true" />
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useWorkflowTab } from "../composables/workflow-header-state";
import WorkflowRunsSwitch from "@renderer/components/WorkflowRunsSwitch.vue";
import { useRouteReadiness } from "@renderer/composables/useRouteReadiness";
import { computed, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "primevue/button";
import Message from "primevue/message";
import { useAPI } from "@renderer/composables/api";
import type { BuildHistoryEntry } from "@pipelab/shared";
import { resolveWorkflowRunsState, scheduleWorkflowRunsRefresh } from "./workflow-runs-state";
import { useAgentAvailability } from "@renderer/composables/useAgentAvailability";

const route = useRoute();
useWorkflowTab(() => void loadRuns());
const router = useRouter();
const api = useAPI();
const agent = useAgentAvailability();
const flowId = computed(() => String(route.params.flowId));
const projectId = computed(() => String(route.params.projectId));
const basePath = computed(() => `/workflows/${flowId.value}/${projectId.value}`);
const entries = ref<BuildHistoryEntry[]>([]);
const workflowName = ref("Workflow");
const loading = ref(true);
useRouteReadiness(computed(() => !agent.isReady.value || !loading.value));
const historyError = ref("");
const workflowError = ref("");
let refreshTimer: ReturnType<typeof setTimeout> | undefined;
let loadGeneration = 0;

const loadRuns = async () => {
  if (!agent.isReady.value) return;
  if (refreshTimer) clearTimeout(refreshTimer);
  const generation = ++loadGeneration;
  if (!entries.value.length) loading.value = true;
  historyError.value = "";
  workflowError.value = "";
  try {
    const [historyResult, workflowResult] = await Promise.allSettled([
      api.execute("build-history:get-all", {
        query: { workflowId: flowId.value, projectId: projectId.value },
      }),
      api.execute("workflow:load", {
        workflowId: flowId.value,
        projectId: projectId.value,
      }),
    ]);
    if (generation !== loadGeneration) return;
    const history =
      historyResult.status === "fulfilled"
        ? historyResult.value
        : { type: "error" as const, ipcError: String(historyResult.reason) };
    const workflow =
      workflowResult.status === "fulfilled"
        ? workflowResult.value
        : { type: "error" as const, ipcError: String(workflowResult.reason) };
    const state = resolveWorkflowRunsState(history, workflow, flowId.value, projectId.value);
    entries.value = state.entries;
    historyError.value = state.historyError;
    workflowError.value = state.workflowError;
    workflowName.value = state.workflowName;
  } catch (cause) {
    if (generation !== loadGeneration) return;
    historyError.value = cause instanceof Error ? cause.message : String(cause);
  } finally {
    if (generation === loadGeneration) {
      loading.value = false;
      if (!historyError.value && !workflowError.value)
        refreshTimer = scheduleWorkflowRunsRefresh(entries.value, () => void loadRuns());
    }
  }
};
const openRun = (entry: BuildHistoryEntry) => router.push(`${basePath.value}/runs/${entry.id}`);
const shortId = (id: string) => (id.length > 12 ? id.slice(0, 8) : id);
const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
const formatDuration = (entry: BuildHistoryEntry) => {
  const seconds = Math.max(
    0,
    Math.floor(
      (entry.duration ??
        (entry.status === "running" ? Date.now() : (entry.endTime ?? Date.now())) -
          entry.startTime) / 1000,
    ),
  );
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return seconds % 60 ? `${minutes}m ${seconds % 60}s` : `${minutes}m`;
};
const statusIcon = (status: BuildHistoryEntry["status"]) =>
  ({
    running: "mdi mdi-loading",
    completed: "mdi mdi-check-circle",
    "completed-with-errors": "mdi mdi-alert-circle",
    failed: "mdi mdi-close-circle",
    cancelled: "mdi mdi-cancel",
  })[status];
const statusLabel = (status: BuildHistoryEntry["status"]) => status.replaceAll("-", " ");
watch(
  agent.isReady,
  (ready) => {
    if (!ready) {
      loadGeneration++;
      if (!entries.value.length) loading.value = true;
      return;
    }
    void loadRuns();
  },
  { immediate: true },
);
watch([flowId, projectId], () => {
  entries.value = [];
  workflowName.value = "Workflow";
  if (agent.isReady.value) void loadRuns();
  else loading.value = true;
});
onUnmounted(() => {
  loadGeneration++;
  if (refreshTimer) clearTimeout(refreshTimer);
});
</script>

<style scoped>
.runs-page {
  container: run-history / inline-size;
  color: var(--p-text-color);
}
.list-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}
.list-heading h2 {
  margin: 0;
  font-size: 1.15rem;
}
.list-heading p {
  margin: 4px 0 0;
  color: var(--pl-muted);
  font-size: 0.8rem;
}
.run-count {
  color: var(--pl-muted);
  font-size: 0.8rem;
}
.run-list {
  border-top: 1px solid var(--pl-border);
}
.run-row {
  display: grid;
  width: 100%;
  grid-template-columns:
    22px minmax(190px, 1.5fr) minmax(110px, 0.9fr) 62px minmax(140px, 0.9fr)
    18px;
  align-items: center;
  gap: 14px;
  padding: 13px 10px;
  border: 0;
  border-bottom: 1px solid var(--pl-border);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s var(--pl-ease);
}
.run-row.is-running {
  background: color-mix(in srgb, var(--pl-info) 6%, transparent);
}
.run-row:hover {
  background: var(--pl-hover);
}
.run-row:focus-visible {
  position: relative;
  z-index: 1;
  outline: 2px solid var(--pl-focus);
  outline-offset: -2px;
  border-radius: 4px;
}
.run-main,
.run-time,
.run-summary {
  display: grid;
  gap: 3px;
  min-width: 0;
}
.run-main small > span:last-child,
.run-main strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
  font-weight: 600;
}
.run-main small,
.run-time small,
.run-summary small {
  display: flex;
  gap: 7px;
  min-width: 0;
  overflow: hidden;
  color: var(--pl-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
}
.run-id {
  flex: none;
  font-family: var(--pl-font-mono);
}
.run-time strong,
.run-summary strong {
  font-size: 0.8rem;
  font-weight: 550;
}
.run-duration {
  font-variant-numeric: tabular-nums;
  font-size: 0.8rem;
  color: var(--pl-muted);
}
.status-mark {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  font-size: 18px;
  color: var(--pl-status-color, var(--pl-muted));
}
.status-running {
  animation: spin 1.3s linear infinite;
}
.row-chevron {
  color: var(--pl-muted);
}
.empty-state {
  display: grid;
  justify-items: center;
  gap: 9px;
  padding: 64px 20px;
  border: 1px dashed var(--pl-border-strong);
  border-radius: var(--pl-radius);
  background: var(--pl-sunken);
  text-align: center;
  color: var(--pl-muted);
}
.empty-state > i {
  font-size: 30px;
  color: var(--pl-accent);
}
.empty-state strong {
  color: var(--p-text-color);
  font-size: 0.95rem;
}
.empty-state span {
  font-size: 0.85rem;
}
.state-copy {
  display: grid;
  gap: 4px;
}
.state-copy span {
  font-size: 0.85rem;
}
.history-skeleton {
  border-top: 1px solid var(--pl-border);
}
.skeleton-row {
  display: flex;
  gap: 18px;
  align-items: center;
  height: 60px;
  border-bottom: 1px solid var(--pl-border);
}
.skeleton-row span {
  width: 90px;
  height: 10px;
  border-radius: 8px;
  background: var(--pl-skeleton);
  animation: pulse 1.3s ease-in-out infinite;
}
.skeleton-row span:nth-child(2) {
  width: 230px;
}
.skeleton-row span:nth-child(3) {
  width: 130px;
  margin-left: auto;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes pulse {
  50% {
    opacity: 0.45;
  }
}
@container run-history (width < 650px) {
  .run-row {
    grid-template-columns: 22px minmax(0, 1fr) auto 18px;
    gap: 10px;
  }
  .run-main {
    grid-column: 2 / 4;
  }
  .run-time {
    grid-column: 2;
  }
  .run-duration {
    grid-column: 3;
    grid-row: 2;
  }
  .run-summary {
    grid-column: 2 / 4;
  }
  .row-chevron {
    grid-column: 4;
    grid-row: 1 / 4;
  }
  .run-time strong,
  .run-time small {
    display: inline;
  }
  .run-time {
    display: block;
  }
  .run-time small {
    margin-left: 6px;
  }
  .run-summary {
    display: block;
  }
  .run-summary strong {
    margin-right: 8px;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>

import type { ArtifactDescriptor, WorkflowStep } from "@pipelab/workflow-runtime";
import type { IconType, RendererProviderMetadata } from "../plugins/definitions";

export type { ArtifactDescriptor, ArtifactKind } from "@pipelab/workflow-runtime";

export const RELEASE_CONFIG_VERSION = "3.1.0" as const;

export const RELEASE_BEFORE_BUILD_TASK_ID = "@pipelab/core/release/before-build" as const;

export type ReleaseConfigVersion = typeof RELEASE_CONFIG_VERSION;

export interface ReleaseBeforeBuildHook {
  id: string;
  enabled: boolean;
  command: string;
}

export interface ArtifactConstraint {
  kind?: string | string[];
  technology?: string | string[];
  platform?: string | string[];
  architecture?: string | string[];
  container?: "file" | "directory" | "archive" | Array<"file" | "directory" | "archive">;
  format?: string | string[];
  capabilities?: string[];
}

export interface ValidationIssue {
  code: string;
  message: string;
  severity: "error" | "warning";
  path?: string;
}

export interface ReleaseSourceConfig {
  provider: string;
  config: Record<string, unknown>;
}

export interface ReleaseProducerTarget {
  id: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface ReleaseProducerConfig {
  id: string;
  provider: string;
  enabled: boolean;
  targets: ReleaseProducerTarget[];
  config: Record<string, unknown>;
  /** Single input. Absent for producers that consume several inputs (`inputs` is set instead). */
  input?: ArtifactRef;
  /** Ordered inputs for producers whose definition declares `inputs: "many"`. */
  inputs?: ArtifactRef[];
}

export type ArtifactRef = ArtifactRefSource | ArtifactRefProducer;

export type ReleaseOutputRef = ArtifactRefSource | ReleaseOutputRefBuild;

export interface ReleaseBuildProfileConfig {
  id: string;
  type: string;
  engine: string;
  input?: ReleaseOutputRef;
  /** Explicit ordered inputs; required for engines whose definition declares `inputs: "many"`. */
  inputs?: ReleaseOutputRef[];
  config: Record<string, unknown>;
  targets: ReleaseBuildTargetConfig[];
  beforeBuild?: ReleaseBeforeBuildHook[];
  name?: string;
}

/** A target a build can produce. It is used when a slot or another build reads it. */
export interface ReleaseBuildTargetConfig {
  id: string;
  config: Record<string, unknown>;
}

export interface ReleaseDestinationSlot {
  id: string;
  name?: string;
  enabled: boolean;
  input?: ReleaseOutputRef;
  config: Record<string, unknown>;
}

export interface ResolvedReleaseDestinationSlot extends Omit<ReleaseDestinationSlot, "input"> {
  input?: ArtifactRef;
}

export interface ResolvedReleaseDestinationConfig extends Omit<ReleaseDestinationConfig, "slots"> {
  slots: ResolvedReleaseDestinationSlot[];
}

export interface ReleaseDestinationConfig {
  id: string;
  provider: string;
  name?: string;
  enabled: boolean;
  config: Record<string, unknown>;
  slots: ReleaseDestinationSlot[];
}

/** What makes a notification target fire. A destination trigger names a destination of the workflow. */
export type ReleaseNotificationTrigger = ReleaseRunTrigger | ReleaseDestinationTrigger;

/** A place a finished run is announced, such as a Discord channel. Runs in the engine for every host. */
export interface ReleaseNotificationConfig {
  id: string;
  provider: string;
  name?: string;
  enabled: boolean;
  /** Absent means a finished run, whether it succeeded or failed. */
  triggers?: ReleaseNotificationTrigger[];
  config: Record<string, unknown>;
}

/** How long a workflow keeps its runs. A rule that is absent is not applied. */
export interface ReleaseRetentionPolicy {
  /** Run history. Pruning a run also removes its artifacts. */
  history?: ReleaseRetentionLimits;
  /** Artifacts only: the run stays in history, its files are removed. Usually stricter than history. */
  artifacts?: ReleaseRetentionLimits;
  /** Failed and completed-with-errors runs are noise sooner than good ones. */
  failedMaxAgeDays?: number;
  /** Never prune the newest successful run, whatever the other rules say. Default: true. */
  keepLatestSuccessful?: boolean;
}

/** Workflow-wide options. Every field is optional; an absent field takes its documented default. */
export interface ReleaseWorkflowSettings {
  /** Check destination accounts before the first step starts. Default: true. */
  checkDestinations?: boolean;
  /** Keep what a failed run's completed steps produced. Default: true. */
  keepFailedArtifacts?: boolean;
  retention?: ReleaseRetentionPolicy;
  /**
   * Which finished runs announce themselves, to the desktop (UI-started runs) and to every
   * notification target (any host). Cancelled runs never notify. Both default: true.
   */
  notifications?: ReleaseWorkflowSettingsNotifications;
}

export interface ReleaseConfig {
  version: ReleaseConfigVersion;
  id: string;
  project: string;
  name: string;
  description?: string;
  source: ReleaseSourceConfig;
  builds: ReleaseBuildProfileConfig[];
  destinations: ReleaseDestinationConfig[];
  /** Where a finished run is announced. Absent means none. */
  notifications?: ReleaseNotificationConfig[];
  continueOnError?: boolean;
  settings?: ReleaseWorkflowSettings;
}

export interface CompiledArtifactReference {
  stepId: string;
  artifact: string;
}

export interface CompiledArtifact {
  reference: CompiledArtifactReference;
  descriptor: ArtifactDescriptor;
}

export interface CompiledSource {
  steps: WorkflowStep[];
  artifact: CompiledArtifact;
}

export interface CompiledProducer {
  steps: WorkflowStep[];
  artifacts: Record<string, CompiledArtifact>;
}

/** One resolved input handed to a multi-input producer, in the order declared on the build. */
export interface CompiledInput {
  artifact: CompiledArtifact;
  /** The configured reference this input was resolved from. */
  ref: ReleaseOutputRef;
  /** Stable, folder-safe name for this input (for example `win-windows-x64` or `source`). */
  label: string;
}

export interface ReleaseHostContext {
  platform: string;
  architecture: string;
  [key: string]: unknown;
}

export interface ReleaseHostCapabilities {
  host: ReleaseHostContext;
}

export interface ReleaseProviderContext {
  host: ReleaseHostContext;
  sourceConfig?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ReleaseCompileContext extends ReleaseProviderContext {
  variables?: Record<string, unknown>;
  /** Query run-environment availability without exposing credential values to compilers. */
  getEnvironmentVariableStatus?: (name: string) => ReleaseValueStatus;
}

export interface ReleaseValidationContext extends ReleaseProviderContext {
  source?: ArtifactDescriptor;
  sourceConfig?: Record<string, unknown>;
}

export interface Availability {
  available: boolean;
  reason?: string;
}

export interface ReleaseFieldDefinition {
  key: string;
  type: "text" | "password" | "number" | "directory" | "file" | "select" | "connection";
  label: string;
  description?: string;
  /** Opt in to showing this field in the creation wizard; otherwise it is set in Configuration. */
  showInWizard?: boolean;
  integration?: string;
  required?: boolean;
  /** Hint shown inside an empty text input. */
  placeholder?: string;
  /**
   * For `select` fields these are the choices. For `text` fields they are one-click suggestions
   * that fill the input; any other value can still be typed.
   */
  options?: ReleaseFieldOption[];
  fileExtensions?: string[];
  /**
   * How a `file` field is chosen. `open` picks an existing file (the default); `save` picks a path
   * that may not exist yet, such as an output file.
   */
  pathMode?: "open" | "save";
  /** For `text` fields: the longest value the destination accepts; longer text is cut when sent. */
  maxLength?: number;
}

export interface ReleaseFieldOption {
  label: string;
  value: string;
  metadata?: Record<string, unknown>;
}

export interface SourceInspection {
  metadata?: Record<string, unknown>;
  data?: Record<string, unknown>;
  fieldOptions?: Record<string, ReleaseFieldOption[]>;
  fieldValues?: Record<string, unknown>;
  issues: ValidationIssue[];
}

export interface ProducerInspection {
  data?: Record<string, unknown>;
  fieldOptions?: Record<string, ReleaseFieldOption[]>;
  fieldValues?: Record<string, unknown>;
  issues: ValidationIssue[];
}

export interface ReleaseSourceDefinition {
  id: string;
  label: string;
  description?: string;
  icon?: IconType;
  fields?: ReleaseFieldDefinition[];
  output: ArtifactDescriptor;
  createDefaultConfig(): Record<string, unknown>;
  validate(config: Record<string, unknown>): ValidationIssue[];
  inspect?(
    config: Record<string, unknown>,
    context: ReleaseProviderContext,
  ): Promise<SourceInspection>;
  compile(config: Record<string, unknown>, context: ReleaseCompileContext): CompiledSource;
}

export interface ReleaseProducerTargetDefinition {
  id: string;
  label: string;
  output?: ArtifactDescriptor;
  transform?: ArtifactDescriptorTransform;
  fields?: ReleaseFieldDefinition[];
  createDefaultConfig(): Record<string, unknown>;
  isAvailable?(context: ReleaseHostContext): Availability;
  buildType?: string;
}

export interface ArtifactDescriptorTransform {
  changes?: Partial<ArtifactDescriptor>;
  remove?: Array<"technology" | "platform" | "architecture" | "format" | "capabilities">;
}

export interface ReleaseProducerDefinition {
  id: string;
  label: string;
  description?: string;
  icon?: IconType;
  fields?: ReleaseFieldDefinition[];
  accepts: ArtifactConstraint;
  planning: ReleaseProducerPlanning;
  supportsBeforeBuildHooks?: boolean;
  /**
   * `many` lets a build consume several explicit inputs (`ReleaseBuildProfileConfig.inputs`).
   * `accepts` then applies to each input. Such producers implement `compileMany`; `compile` is not used.
   */
  inputs?: "many";
  targets: ReleaseProducerTargetDefinition[];
  createDefaultConfig(): Record<string, unknown>;
  validate(config: ReleaseProducerConfig, context: ReleaseValidationContext): ValidationIssue[];
  inspect?(
    config: ReleaseProducerConfig,
    context: ReleaseProviderContext,
  ): Promise<ProducerInspection>;
  /** Single-input compilation. Multi-input producers (`inputs: "many"`) never reach it and may throw. */
  compile(
    input: CompiledArtifact,
    config: ReleaseProducerConfig,
    context: ReleaseCompileContext,
  ): CompiledProducer;
  /** Multi-input compilation, called with every resolved input in declared order. */
  compileMany?(
    inputs: CompiledInput[],
    config: ReleaseProducerConfig,
    context: ReleaseCompileContext,
  ): CompiledProducer;
  acceptsWhen?(artifact: ArtifactDescriptor, context: ReleaseAcceptanceContext): ArtifactAcceptance;
}

export interface ReleaseProducerPlanning {
  mode: "build" | "automatic";
}

export type ArtifactAcceptance = ArtifactAccepted | ArtifactRejected;

export interface ReleaseAcceptanceContext extends ReleaseProviderContext {
  producer?: ReleaseProducerDefinition;
  destination?: ReleaseDestinationDefinition;
}

export interface ReleaseDestinationDefinition {
  id: string;
  label: string;
  description?: string;
  icon?: IconType;
  fields?: ReleaseFieldDefinition[];
  slotFields?: ReleaseFieldDefinition[];
  accepts: ArtifactConstraint;
  /** The destination only takes a build output; a slot may not read the raw source directly. */
  requiresBuild?: boolean;
  createDefaultConfig(): Record<string, unknown>;
  validate(config: ReleaseDestinationConfig, context: ReleaseValidationContext): ValidationIssue[];
  compile(
    artifact: CompiledArtifact,
    destination: ResolvedReleaseDestinationConfig,
    slot: ResolvedReleaseDestinationSlot,
    context: ReleaseCompileContext,
  ): WorkflowStep[];
  acceptsWhen?(artifact: ArtifactDescriptor, context: ReleaseAcceptanceContext): ArtifactAcceptance;
}

/** What a notification message can say about a finished run. */
export interface ReleaseNotificationEvent {
  workflow: string;
  /** `success`, or `failure` for a failed run or one that completed with errors. */
  status: "success" | "failure";
  version: string;
  /** Run time in milliseconds. */
  durationMs: number;
  /** One entry per delivery the run attempted. */
  destinations: Array<ReleaseNotificationEventDestinations>;
  /** Redacted summary of what failed, when something did. */
  error?: string;
}

/** The variables a notification template may use, as `{{name}}`. */
export const NOTIFICATION_TEMPLATE_VARIABLES = [
  "workflow",
  "status",
  "duration",
  "version",
  "destinations",
  "error",
] as const;

export interface ReleaseNotificationDefinition {
  id: string;
  label: string;
  description?: string;
  icon?: IconType;
  fields?: ReleaseFieldDefinition[];
  createDefaultConfig(): Record<string, unknown>;
  validate(config: ReleaseNotificationConfig): ValidationIssue[];
}

export interface ReleaseBuildTypeDefinition {
  id: string;
  label: string;
  description?: string;
  icon?: IconType;
}

export interface ProviderReleaseDefinition {
  sources?: ReleaseSourceDefinition[];
  producers?: ReleaseProducerDefinition[];
  destinations?: ReleaseDestinationDefinition[];
  notifications?: ReleaseNotificationDefinition[];
}

export interface ReleaseRegistry {
  sources: ReleaseSourceDefinition[];
  producers: ReleaseProducerDefinition[];
  destinations: ReleaseDestinationDefinition[];
  notifications?: ReleaseNotificationDefinition[];
}

export interface ReleaseCatalogTarget {
  id: string;
  label: string;
  buildType?: string;
  output?: ArtifactDescriptor;
  transform?: ArtifactDescriptorTransform;
  defaultConfig: Record<string, unknown>;
  fields?: ReleaseFieldDefinition[];
  availability?: Availability;
  availabilityStatus?: "unknown";
}

export interface ReleaseCatalogSource {
  id: string;
  label: string;
  description?: string;
  icon?: IconType;
  fields?: ReleaseFieldDefinition[];
  output: ArtifactDescriptor;
  defaultConfig: Record<string, unknown>;
  requiresAgentInspection?: boolean;
}

export interface ReleaseCatalogProducer {
  id: string;
  label: string;
  description?: string;
  icon?: IconType;
  fields?: ReleaseFieldDefinition[];
  accepts: ArtifactConstraint;
  planning: ReleaseProducerPlanning;
  supportsBeforeBuildHooks?: boolean;
  inputs?: "many";
  defaultConfig: Record<string, unknown>;
  targets: ReleaseCatalogTarget[];
  requiresAgentInspection?: boolean;
}

export interface ReleaseCatalogDestination {
  id: string;
  label: string;
  description?: string;
  icon?: IconType;
  fields?: ReleaseFieldDefinition[];
  slotFields?: ReleaseFieldDefinition[];
  accepts: ArtifactConstraint;
  /** The destination only takes a build output; a slot may not read the raw source directly. */
  requiresBuild?: boolean;
  defaultConfig: Record<string, unknown>;
}

export interface ReleaseCatalogNotification {
  id: string;
  label: string;
  description?: string;
  icon?: IconType;
  fields?: ReleaseFieldDefinition[];
  defaultConfig: Record<string, unknown>;
}

export interface ReleaseCatalog {
  buildTypes: ReleaseBuildTypeDefinition[];
  sources: ReleaseCatalogSource[];
  producers: ReleaseCatalogProducer[];
  destinations: ReleaseCatalogDestination[];
  notifications?: ReleaseCatalogNotification[];
}

export const BROWSER_PROVIDER_SPECS_SCHEMA_VERSION = 1 as const;

export interface BrowserProviderSpecs {
  schemaVersion: typeof BROWSER_PROVIDER_SPECS_SCHEMA_VERSION;
  releaseConfigVersion: typeof RELEASE_CONFIG_VERSION;
  catalog: ReleaseCatalog;
  providers: Array<Omit<RendererProviderMetadata, "release">>;
}

export interface PlannedReleaseOutput {
  buildId?: string;
  targetId?: string;
  ref: ReleaseOutputRef;
  artifactRef: ArtifactRef;
  descriptor: ArtifactDescriptor;
}

export interface ReleasePlanGraph {
  nodes: Array<ReleasePlanGraphNodes>;
  edges: Array<ReleasePlanGraphEdges>;
}

export interface ReleasePlan {
  producers: ReleaseProducerConfig[];
  outputs: PlannedReleaseOutput[];
  destinations: ResolvedReleaseDestinationConfig[];
  issues: ValidationIssue[];
  graph: ReleasePlanGraph;
}

export interface ArtifactRefSource {
  source: true;
}

export interface ArtifactRefProducer {
  producerId: string;
  outputId: string;
}

export interface ReleaseOutputRefBuild {
  buildId: string;
  targetId: string;
}

export interface ReleaseRunTrigger {
  on: "success" | "failure";
}

export interface ReleaseDestinationTrigger {
  on: "destination-completed" | "destination-failed";
  destinationId: string;
}

export interface ReleaseRetentionLimits {
  maxRuns?: number;
  maxAgeDays?: number;
}

export interface ReleaseWorkflowSettingsNotifications {
  onSuccess?: boolean;
  onFailure?: boolean;
}

export interface ReleaseValueStatus {
  configured: boolean;
  nonEmpty: boolean;
}

export interface ArtifactAccepted {
  accepted: true;
}

export interface ArtifactRejected {
  accepted: false;
  reason?: string;
}

export interface ReleaseNotificationEventDestinations {
  /** The workflow destination this delivery went to, so a trigger can name it. */
  destinationId?: string;
  name: string;
  status: "completed" | "failed";
  url?: string;
  error?: string;
}

export interface ReleasePlanGraphNodes {
  id: string;
  kind: "source" | "build" | "automatic" | "destination";
}

export interface ReleasePlanGraphEdges {
  from: string;
  to: string;
}

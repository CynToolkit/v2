export interface IsSourceRefResult {
  source: true;
}

interface UsedValueSelectionProducersTargets {
  id: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface UsedValueSelectionProducers {
  provider: string;
  config: Record<string, unknown>;
  targets: ReadonlyArray<UsedValueSelectionProducersTargets>;
}

interface UsedValueSelectionDestinationsSlots {
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface UsedValueSelectionDestinations {
  provider: string;
  config: Record<string, unknown>;
  slots: ReadonlyArray<UsedValueSelectionDestinationsSlots>;
}

export interface UsedValueDefinitionsSources {
  id: string;
}

export interface ForEachUsedValue {
  key: string;
}

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

interface UsedValueDefinitionsSources {
  id: string;
}

export interface ForEachUsedValue {
  key: string;
}

interface FieldBearer<TField> {
  fields?: readonly TField[];
}

export type UsedValueDefinitionsEntry<TField> = FieldBearer<TField> & UsedValueDefinitionsSources;

export interface UsedValueDefinitionsProducer<TField> extends FieldBearer<TField> {
  id: string;
  targets: ReadonlyArray<UsedValueDefinitionsEntry<TField>>;
}

export interface UsedValueDefinitionsDestination<TField> extends FieldBearer<TField> {
  id: string;
  slotFields?: readonly TField[];
}

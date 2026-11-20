export interface MergeCatalogItems {
  id: string;
}

export interface MergeDefinition {
  id: string;
  label: string;
  description?: string;
  icon?: unknown;
  fields?: unknown[];
  defaultConfig: Record<string, unknown>;
}

export interface RequirementsFieldsEntry {
  key: string;
  required: boolean;
  secret: boolean;
}

export interface IntegrationRequirements {
  identity: string;
  providerId: string;
  integrationName: string;
  required: boolean;
  fields: Map<string, RequirementsFieldsEntry>;
}

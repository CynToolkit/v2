export interface PreparePlaywrightProfileOptions {
  preserveAccountOrigins?: readonly string[];
}

export interface ConstructExportExecutionContextPaths {
  thirdparty: string;
  node: string;
}

export type Exportc3pResult = {
  zipFile: string;
};

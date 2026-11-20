import type { TestedConnection } from "./connection-test";

export interface ConnectionSaveDecisionSave {
  action: "save";
}

export interface ConnectionSaveDecisionTest {
  action: "test";
}

export interface ConnectionSaveDecisionBlock {
  action: "block";
  message: string;
}

export interface DecideConnectionSaveInput {
  testable: boolean;
  fingerprint: string;
  tested?: TestedConnection;
}

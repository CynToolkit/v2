export interface TemplatePartText {
  kind: "text";
  text: string;
}

export interface TemplatePartVariable {
  kind: "variable";
  text: string;
  name: string;
  known: boolean;
}

export interface InsertVariableResult {
  value: string;
  caret: number;
}

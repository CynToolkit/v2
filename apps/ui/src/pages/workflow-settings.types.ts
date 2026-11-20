interface RetentionRule {
  id: string;
  before: string;
  unit: string;
  default: number;
  get: () => number | undefined;
  set: (value?: number) => void;
}

export interface RetentionGroup {
  title: string;
  rules: RetentionRule[];
}

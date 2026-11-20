/** The retention limits of one policy group (run history or artifacts). */
export interface RetentionRuleLimits {
  maxRuns?: number;
  maxAgeDays?: number;
}

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

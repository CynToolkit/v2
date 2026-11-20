import type { Candidate, AutomaticStep } from "./planner";

export interface SourceRefResult {
  source: true;
}

export interface AutomaticQueueItem {
  candidate: Candidate;
  steps: AutomaticStep[];
}

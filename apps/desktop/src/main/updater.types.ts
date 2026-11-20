export interface SetFeedURLOptions {
  provider: "generic";
  url: string;
  channel?: string;
}

export interface OnProgress {
  percent: number;
}

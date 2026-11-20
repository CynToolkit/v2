import type { ConstructLoginData } from "./script";

export interface ConstructLoginSuccess {
  loginData: ConstructLoginData;
  startedAt: number;
}

export interface ConstructLoginFailure {
  error: unknown;
  startedAt: number;
}

export interface WaitForLocatorWithAbortOptions {
  state?: "attached" | "detached" | "visible" | "hidden";
  timeout: number;
}

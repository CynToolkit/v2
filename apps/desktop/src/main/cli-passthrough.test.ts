import { describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({ app: {} }));
vi.mock("@electron-toolkit/utils", () => ({ is: { dev: false } }));

import { getCliPassthroughArgs } from "./cli-passthrough";

describe("getCliPassthroughArgs", () => {
  it("returns everything after `cli` when packaged", () => {
    expect(
      getCliPassthroughArgs(["Pipelab", "cli", "workflow", "run", "my-flow", "--dry-run"], false),
    ).toEqual(["workflow", "run", "my-flow", "--dry-run"]);
  });

  it("skips the app path in development", () => {
    expect(getCliPassthroughArgs(["electron", ".", "cli", "--help"], true)).toEqual(["--help"]);
  });

  it("skips switches that come before the command", () => {
    expect(getCliPassthroughArgs(["electron", ".", "--no-sandbox", "cli", "--help"], true)).toEqual(
      ["--help"],
    );
  });

  it("ignores normal launches and a `cli` argument that is not the command", () => {
    expect(getCliPassthroughArgs(["Pipelab"], false)).toBeUndefined();
    expect(getCliPassthroughArgs(["Pipelab", "pipelab://open", "cli"], false)).toBeUndefined();
    expect(getCliPassthroughArgs(["Pipelab", "pipelab://open"], false)).toBeUndefined();
  });
});

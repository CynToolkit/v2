import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { buildCommandTelemetry } from "../../../src/telemetry";

describe("CLI telemetry", () => {
  it("reports only the command name, never positional arguments", async () => {
    const captured: Record<string, unknown>[] = [];
    const program = new Command("pipelab");
    program.hook("postAction", (_thisCommand, actionCommand) => {
      captured.push(buildCommandTelemetry(actionCommand));
    });
    program
      .command("run")
      .argument("<workflow>")
      .argument("[overrides...]")
      .option("--token <value>")
      .action(() => {});

    await program.parseAsync(["node", "pipelab", "run", "flow.json", "secret-connection-value"]);

    expect(captured).toEqual([{ command: "run" }]);
    expect(JSON.stringify(captured)).not.toContain("secret-connection-value");
  });
});

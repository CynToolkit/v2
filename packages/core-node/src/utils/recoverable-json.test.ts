import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, onTestFinished } from "vitest";
import { loadJsonOrRecover } from "./atomic-json";

const parse = (value: unknown): { ok: true } => {
  if (typeof value !== "object" || value === null || !("ok" in value)) throw new Error("invalid");
  return { ok: true };
};

const setup = async () => {
  const directory = await mkdtemp(join(tmpdir(), "pipelab-recoverable-json-"));
  onTestFinished(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, "data.json");
  const load = () => loadJsonOrRecover({ label: "Test", path, parse, fallback: { ok: true } });
  return { directory, path, load };
};

describe("loadJsonOrRecover", () => {
  it("creates a missing file from the fallback", async () => {
    const { path, load } = await setup();
    await expect(load()).resolves.toEqual({ ok: true });
    expect(JSON.parse(await readFile(path, "utf8"))).toEqual({ ok: true });
  });

  it("returns a valid document untouched", async () => {
    const { directory, path, load } = await setup();
    await writeFile(path, JSON.stringify({ ok: 1 }));
    await expect(load()).resolves.toEqual({ ok: true });
    expect(await readdir(directory)).toEqual(["data.json"]);
  });

  it.each([
    ["malformed JSON", "{broken"],
    ["a rejected document", JSON.stringify({ no: 1 })],
  ])("keeps a backup and resets on %s", async (_label, content) => {
    const { directory, path, load } = await setup();
    await writeFile(path, content);
    await expect(load()).resolves.toEqual({ ok: true });
    const backup = (await readdir(directory)).find((name) => name.startsWith("data.json.invalid-"));
    await expect(readFile(join(directory, backup ?? ""), "utf8")).resolves.toBe(content);
    expect(JSON.parse(await readFile(path, "utf8"))).toEqual({ ok: true });
  });
});

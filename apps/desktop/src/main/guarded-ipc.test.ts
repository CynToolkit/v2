import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { guardedIpcMain } from "./guarded-ipc";

type Listener = (event: unknown, ...args: unknown[]) => unknown;

const setup = () => {
  const handlers = new Map<string, Listener>();
  const guarded = guardedIpcMain(
    {
      handle: (channel, listener) => void handlers.set(channel, listener as Listener),
      removeHandler: (channel) => void handlers.delete(channel),
    },
    () => ["http://127.0.0.1:4000"],
  );
  return { handlers, guarded };
};

describe("guardedIpcMain", () => {
  it("runs handlers for the app origin and rejects every other sender", async () => {
    const { handlers, guarded } = setup();
    guarded.handle("shell:openExternal", (_event, url) => `opened ${url}`);
    const call = handlers.get("shell:openExternal")!;

    assert.equal(
      await call({ senderFrame: { url: "http://127.0.0.1:4000/#token=x" } }, "https://a.b"),
      "opened https://a.b",
    );
    for (const senderFrame of [{ url: "https://evil.example/" }, { url: "" }, null, undefined]) {
      assert.throws(() => call({ senderFrame }, "https://a.b"), /untrusted origin/);
    }
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { useLogger } from "@pipelab/shared";
import { partialDouble } from "@pipelab/shared/test-doubles";
import type { WebSocket } from "ws";
import { useAPI } from "./ipc-core";

describe("IPC payload logging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not log environment values submitted by the initiating client", async () => {
    const { handle, processWebSocketMessage } = useAPI();
    const secret = "client-workflow-secret";
    const debug = vi.spyOn(useLogger().logger(), "debug");
    handle("workflow:execute", async () => undefined);

    await processWebSocketMessage({ url: "test-client" } as WebSocket, {
      channel: "workflow:execute",
      requestId: "request-1",
      data: { name: "workflows/release", env: { PUBLISH_TOKEN: secret } },
    });

    expect(JSON.stringify(debug.mock.calls)).not.toContain(secret);
  });

  it("sends the Cloud access token to the requesting client without logging it", async () => {
    const { handle, processWebSocketMessage } = useAPI();
    const debug = vi.spyOn(useLogger().logger(), "debug");
    const send = vi.fn();
    const accessToken = "private-cloud-access-token";
    handle("auth:getCloudAccessToken", async (_, { send: reply }) =>
      reply({ type: "end", data: { type: "success", result: { accessToken } } }),
    );

    await processWebSocketMessage(
      partialDouble<WebSocket>({ url: "test-client", readyState: 1, send }),
      { channel: "auth:getCloudAccessToken", requestId: "request-2", data: undefined },
    );

    expect(send.mock.calls[0]?.[0]).toContain(accessToken);
    expect(JSON.stringify(debug.mock.calls)).not.toContain(accessToken);
  });
});

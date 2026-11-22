import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PipelabContext } from "../context";
import type { Events, WebSocketHandler } from "@pipelab/shared";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

const { handle, invoke, authMethods, loggerInfo, runPasswordAuth } = vi.hoisted(() => ({
  handle: vi.fn(),
  invoke: vi.fn(),
  authMethods: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  loggerInfo: vi.fn(),
  runPasswordAuth: vi.fn(),
}));

vi.mock("../ipc-core", () => ({ useAPI: () => ({ handle }) }));
vi.mock("../pipelab-cloud-auth", () => ({
  getServerCloudAuth: () => ({
    client: { functions: { invoke }, auth: authMethods },
    storage: { runPasswordAuth },
  }),
}));
vi.mock("../websocket-server", () => ({ webSocketServer: { broadcast: vi.fn() } }));
vi.mock("@pipelab/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@pipelab/shared")>();
  return {
    ...actual,
    isSupabaseAvailable: () => true,
    useLogger: () => ({
      logger: () => ({ info: loggerInfo, warn: vi.fn(), error: vi.fn() }),
    }),
  };
});

import { registerAuthHandlers } from "./auth";

describe("auth:invoke error serialization", () => {
  beforeEach(() => {
    handle.mockReset();
    invoke.mockReset();
    loggerInfo.mockReset();
    runPasswordAuth
      .mockReset()
      .mockImplementation((_consent, authenticate: () => unknown) => authenticate());
    const result = {
      data: {
        user: { id: "user-id" },
        session: { access_token: "access-token", refresh_token: "refresh-token" },
      },
      error: null,
    };
    authMethods.signInWithPassword.mockReset().mockResolvedValue(result);
    authMethods.signUp.mockReset().mockResolvedValue(result);
    authMethods.signOut.mockReset().mockResolvedValue({ error: null });
    authMethods.resetPasswordForEmail.mockReset().mockResolvedValue({ error: null });
    authMethods.onAuthStateChange.mockReset();
  });

  it.each(["auth:signInWithPassword", "auth:signUp"] as const)(
    "sends only user data in the %s response",
    async (channel) => {
      registerAuthHandlers({} as PipelabContext);
      const handler = handle.mock.calls.find(([registered]) => registered === channel)?.[1] as
        | WebSocketHandler<typeof channel>
        | undefined;
      const send = vi.fn();
      await handler?.(
        { sender: "test" },
        { value: { email: "user@example.test", password: "test-password" }, send },
      );
      expect(send).toHaveBeenCalledWith({
        type: "end",
        data: { type: "success", result: { data: { user: { id: "user-id" } }, error: null } },
      });
    },
  );

  it("asks for consent before starting password authentication without secure storage", async () => {
    runPasswordAuth.mockResolvedValueOnce(null);
    registerAuthHandlers({} as PipelabContext);
    const handler = handle.mock.calls.find(
      ([channel]) => channel === "auth:signInWithPassword",
    )?.[1] as WebSocketHandler<"auth:signInWithPassword"> | undefined;
    const send = vi.fn();
    const value = { email: "user@example.test", password: "test-password" };
    await handler?.({ sender: "test" }, { value, send });

    expect(authMethods.signInWithPassword).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledWith({
      type: "end",
      data: {
        type: "success",
        result: { data: { user: null }, error: null, requiresPlaintextConsent: true },
      },
    });

    await handler?.({ sender: "test" }, { value: { ...value, allowPlaintextSession: true }, send });
    expect(runPasswordAuth).toHaveBeenLastCalledWith(true, expect.any(Function));
    expect(authMethods.signInWithPassword).toHaveBeenCalledExactlyOnceWith(value);
  });

  it("revokes only the active session and reports a sign-out failure", async () => {
    const error = new Error("Sign-out service unavailable");
    authMethods.signOut.mockResolvedValue({ error });
    registerAuthHandlers({} as PipelabContext);
    const handler = handle.mock.calls.find(([channel]) => channel === "auth:signOut")?.[1] as
      | WebSocketHandler<"auth:signOut">
      | undefined;
    const send = vi.fn();
    await handler?.({ sender: "test" }, { value: undefined, send });
    expect(authMethods.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(send).toHaveBeenCalledWith({
      type: "end",
      data: { type: "error", ipcError: error.message },
    });
  });

  it("serializes the function error message and HTTP status without the response body", async () => {
    const functionError = Object.assign(new Error("Edge Function returned a non-2xx status code"), {
      name: "FunctionsHttpError",
      context: new Response("private response body", { status: 404 }),
    });
    invoke.mockResolvedValue({ data: null, error: functionError });
    registerAuthHandlers({} as PipelabContext);

    const registration = handle.mock.calls.find(([channel]) => channel === "auth:invoke");
    const handler = registration?.[1] as WebSocketHandler<"auth:invoke"> | undefined;
    expect(handler).toBeDefined();

    const sentEvents: Events<"auth:invoke">[] = [];
    await handler?.(
      { sender: "test" },
      {
        value: { name: "polar-user-plan" },
        send: async (events) => {
          sentEvents.push(events);
        },
      },
    );

    const serializedEvents = JSON.stringify(sentEvents[0]);
    expect(serializedEvents).toContain("Edge Function returned a non-2xx status code (HTTP 404)");
    expect(serializedEvents).toContain('"status":404');
    expect(serializedEvents).not.toContain("private response body");
  });

  it("does not write account emails or passwords to auth logs", async () => {
    registerAuthHandlers({} as PipelabContext);
    const email = "private-account@example.test";
    const password = "private-password-value";
    const getHandler = <
      Channel extends "auth:signInWithPassword" | "auth:signUp" | "auth:resetPasswordForEmail",
    >(
      channel: Channel,
    ) =>
      handle.mock.calls.find(([registeredChannel]) => registeredChannel === channel)?.[1] as
        | WebSocketHandler<Channel>
        | undefined;

    await getHandler("auth:signInWithPassword")?.(
      { sender: "test" },
      { value: { email, password }, send: async () => undefined },
    );
    await getHandler("auth:signUp")?.(
      { sender: "test" },
      { value: { email, password }, send: async () => undefined },
    );
    await getHandler("auth:resetPasswordForEmail")?.(
      { sender: "test" },
      { value: { email }, send: async () => undefined },
    );

    const authStateListener = authMethods.onAuthStateChange.mock.calls[0]?.[0] as
      | ((event: AuthChangeEvent, session: Session | null) => Promise<void>)
      | undefined;
    await authStateListener?.("SIGNED_IN", {
      user: { email } as Session["user"],
    } as Session);

    const serializedLogs = JSON.stringify(loggerInfo.mock.calls);
    expect(serializedLogs).not.toContain(email);
    expect(serializedLogs).not.toContain(password);
  });
});

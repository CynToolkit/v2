import { useLogger, isSupabaseAvailable } from "@pipelab/shared";
import { useAPI } from "../ipc-core";
import { getServerCloudAuth } from "../pipelab-cloud-auth";
import type { PipelabContext } from "../context";
import { webSocketServer } from "../websocket-server";

const normalizeFunctionError = (error: unknown) => {
  const name = error instanceof Error ? error.name : "FunctionInvocationError";
  let message = error instanceof Error ? error.message : "Edge Function invocation failed";
  let status: number | undefined;

  if (error instanceof Error && "context" in error) {
    const context = error.context;
    if (context instanceof Response) {
      status = context.status;
    } else if (context instanceof Error && context.message) {
      message = `${message}: ${context.message}`;
    }
  }

  if (status !== undefined) message = `${message} (HTTP ${status})`;
  return { name, message, ...(status === undefined ? {} : { status }) };
};

/**
 * Registers authentication handlers for the CLI/system backend.
 */
export const registerAuthHandlers = (context: PipelabContext) => {
  const { handle } = useAPI();
  const { logger } = useLogger();

  const supabaseAvailable = isSupabaseAvailable();
  if (!supabaseAvailable) {
    logger().warn("[Auth] Supabase is not available. Auth handlers will not be functional.");
    // Register the invoke channel even when cloud services are unavailable.
    // Otherwise browser requests remain pending forever (for example, the
    // upgrade dialog stays on "Loading plans...").
    handle("auth:invoke", async (_, { send }) => {
      return send({
        type: "end",
        data: {
          type: "error",
          ipcError: "Supabase is not configured; cloud functions are unavailable.",
        },
      });
    });
    handle("auth:getCloudAccessToken", async (_, { send }) => {
      return send({ type: "end", data: { type: "success", result: { accessToken: null } } });
    });
    return;
  }

  const auth = getServerCloudAuth(context);
  if (!auth) return;
  const { client, storage } = auth;

  handle("auth:getUser", async (_, { send }) => {
    try {
      const { data, error } = await client.auth.getUser();
      if (error) {
        return send({ type: "end", data: { type: "success", result: { user: null } } });
      }
      return send({ type: "end", data: { type: "success", result: { user: data.user } } });
    } catch {
      return send({ type: "end", data: { type: "success", result: { user: null } } });
    }
  });

  handle("auth:getCloudAccessToken", async (_, { send }) => {
    try {
      const {
        data: { session },
        error,
      } = await client.auth.getSession();
      const accessToken =
        !error && session && !session.user.is_anonymous ? session.access_token : null;
      return send({ type: "end", data: { type: "success", result: { accessToken } } });
    } catch {
      return send({ type: "end", data: { type: "success", result: { accessToken: null } } });
    }
  });

  const registerPasswordAuth = (method: "signInWithPassword" | "signUp") => {
    handle(`auth:${method}`, async (_, { value, send }) => {
      const { email, password, allowPlaintextSession } = value;
      logger().info("[Auth]", method);
      const response = await storage.runPasswordAuth(allowPlaintextSession === true, () =>
        client.auth[method]({ email, password }),
      );
      return send({
        type: "end",
        data: {
          type: "success",
          result: response
            ? { data: { user: response.data.user }, error: response.error }
            : { data: { user: null }, error: null, requiresPlaintextConsent: true },
        },
      });
    });
  };

  registerPasswordAuth("signInWithPassword");
  registerPasswordAuth("signUp");

  handle("auth:signOut", async (_, { send }) => {
    logger().info("[Auth] signOut");
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) return send({ type: "end", data: { type: "error", ipcError: error.message } });
    return send({ type: "end", data: { type: "success", result: undefined } });
  });

  handle("auth:resetPasswordForEmail", async (_, { value, send }) => {
    const { email } = value;
    logger().info("[Auth] resetPasswordForEmail");
    const { error } = await client.auth.resetPasswordForEmail(email);
    return send({ type: "end", data: { type: "success", result: { error } } });
  });

  handle("auth:invoke", async (_, { value, send }) => {
    const { name, options } = value;
    logger().info("[Auth] invoke function:", name);
    try {
      const { data, error } = await client.functions.invoke(name, options);
      return send({
        type: "end",
        data: {
          type: "success",
          result: { data, error: error ? normalizeFunctionError(error) : null },
        },
      });
    } catch (e) {
      return send({
        type: "end",
        data: {
          type: "error",
          ipcError: normalizeFunctionError(e).message,
        },
      });
    }
  });

  // Maintain logs for the backend state change and broadcast to all clients
  client.auth.onAuthStateChange((event, session) => {
    logger().info("[Auth] State changed, broadcasting:", event);
    webSocketServer.broadcast("auth:getUser", {
      type: "end",
      data: { type: "success", result: { user: session?.user || null } },
    });
  });
};

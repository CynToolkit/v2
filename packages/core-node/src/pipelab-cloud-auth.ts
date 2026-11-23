import type { SupportedStorage } from "@supabase/supabase-js";
import { supabase } from "@pipelab/shared";
import { resolve } from "node:path";
import type { PipelabContext } from "./context";
import { isDesktopHosted } from "./desktop-host";
import { DesktopAuthStorage } from "./utils/desktop-auth-storage";
import { SecureCloudAuthStorage } from "./utils/secure-cloud-auth-storage";

interface ServerCloudAuth {
  client: NonNullable<ReturnType<typeof supabase>>;
  storage: DesktopAuthStorage;
}

/**
 * Supabase reads the session from its background initialisation with nothing awaiting the
 * result, so a rejection there would crash the whole server. An unreadable saved session
 * (old format, lost key) is treated as signed out; the file is kept for a fresh sign-in.
 */
const tolerateUnreadableSession = (storage: DesktopAuthStorage): SupportedStorage => ({
  getItem: async (key) => {
    try {
      return await storage.getItem(key);
    } catch (error) {
      console.warn(
        "[Auth] The saved Pipelab Cloud session could not be read, so you are signed out. " +
          "Sign in again to replace it.",
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  },
  setItem: (key, value) => storage.setItem(key, value),
  removeItem: (key) => storage.removeItem(key),
});

const serverClients = new Map<string, ServerCloudAuth>();

export const getServerCloudAuth = (context: PipelabContext) => {
  const sessionPath = resolve(context.getConfigPath("auth-session.json"));
  const existing = serverClients.get(sessionPath);
  if (existing) return existing;
  const storage = new DesktopAuthStorage(sessionPath);
  const client = supabase({
    auth: {
      storage: tolerateUnreadableSession(storage),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  if (!client) return null;
  const auth = { client, storage };
  serverClients.set(sessionPath, auth);
  return auth;
};

export const createPipelabCloudAuthClient = (context: PipelabContext) =>
  isDesktopHosted()
    ? (getServerCloudAuth(context)?.client ?? null)
    : supabase({
        auth: {
          storage: new SecureCloudAuthStorage(context),
          persistSession: true,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

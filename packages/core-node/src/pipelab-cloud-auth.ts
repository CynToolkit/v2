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

const serverClients = new Map<string, ServerCloudAuth>();

export const getServerCloudAuth = (context: PipelabContext) => {
  const sessionPath = resolve(context.getConfigPath("auth-session.json"));
  const existing = serverClients.get(sessionPath);
  if (existing) return existing;
  const storage = new DesktopAuthStorage(sessionPath);
  const client = supabase({
    auth: {
      storage,
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

import { supabase } from "@pipelab/shared";
import type { PipelabContext } from "./context";
import { isDesktopHosted } from "./desktop-host";
import { SecureCloudAuthStorage } from "./utils/secure-cloud-auth-storage";
import { JsonFileStorage } from "./utils/storage";

export const createPipelabCloudAuthClient = (context: PipelabContext) => {
  const storage = isDesktopHosted()
    ? new JsonFileStorage("auth-session.json", context)
    : new SecureCloudAuthStorage(context);
  return supabase({
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
};

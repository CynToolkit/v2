import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL || "";
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || "";
  return { url, publishableKey };
};

export const isSupabaseAvailable = () => {
  const { url, publishableKey } = getSupabaseConfig();
  const available = !!(url && publishableKey);

  return available;
};

export const supabase = (options?: SupabaseClientOptions<"public">) => {
  const { url, publishableKey } = getSupabaseConfig();
  if (!url || !publishableKey) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "Supabase environment variables are not configured. Supabase will not be available.",
      );
    }
    return null;
  }
  return createClient<Database>(url, publishableKey, options);
};

import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseAvailable, supabase } from "./supabase";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({}) as never),
}));

describe("Supabase client configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("is unavailable and creates no client when URL and keys are missing", () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "");

    expect(isSupabaseAvailable()).toBe(false);
    expect(supabase()).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("passes the publishable key to Supabase", () => {
    vi.stubEnv("SUPABASE_URL", "https://local.supabase.test");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_current");

    supabase();

    expect(createClient).toHaveBeenCalledWith(
      "https://local.supabase.test",
      "sb_publishable_current",
      undefined,
    );
  });
});

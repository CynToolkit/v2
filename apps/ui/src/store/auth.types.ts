import type { User } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";
import type { AuthChangeEvent } from "@supabase/supabase-js";
import type { Subscription } from "./auth";

export interface AuthActionResponseData {
  user: User | null;
  session: Session | null;
}

export interface InFlightSubscription {
  requestId: number;
  userId: string;
  promise: Promise<void>;
}

export interface OnAuthChanged {
  event: AuthChangeEvent;
  session: Session | null;
}

export interface OnSubscriptionChanged {
  subscriptions: Subscription[];
}

export interface InvokeFunctionOptions {
  body?: Record<string, unknown>;
}

export interface ResetPasswordResult {
  error: Error | null;
}

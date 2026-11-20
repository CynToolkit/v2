import type { BillingPlanBenefit, BillingSubscriptionProduct } from "./billing.types";

/**
 * Shapes returned by the `polar-available-plans` and `polar-user-plan` Edge Functions
 * (see supabase/functions/_shared/billing.ts). These are intentionally not the Polar SDK
 * models: the functions return a trimmed camelCase projection, not the raw Polar API payload.
 */
interface BillingPlanPrice {
  amountType: string;
  priceAmount: number | null;
  priceCurrency: string;
}

export interface BillingPlan {
  id: string;
  name: string;
  description: string | null;
  recurringInterval: string | null;
  prices: BillingPlanPrice[];
  benefits: BillingPlanBenefit[];
}

export interface BillingSubscription {
  id: string;
  status: string;
  amount: number;
  currency: string;
  recurringInterval: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  // `benefits` is not currently returned by the function; consumers must tolerate it being absent.
  product: BillingSubscriptionProduct;
}

export interface BillingPlanBenefit {
  description: string;
}

interface BillingSubscriptionProductBenefit {
  id?: string;
}

export interface BillingSubscriptionProduct {
  id: string;
  name: string;
  benefits?: BillingSubscriptionProductBenefit[];
}

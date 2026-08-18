export interface StartSubscriptionInput {
  hostEmail: string;
  hostBusinessName: string;
  planKey: string;
  priceUsd: string;
  billingInterval: string;
}

export interface StartSubscriptionResult {
  customerId: string;
  subscriptionId: string;
}

/**
 * Abstraction over the billing rail for paid plans — exists so a provider
 * can be swapped without touching callers, same reasoning payment-core's
 * Facilitator abstraction used for GoPlausible. Stripe is the only
 * implementation planned (see stripeBillingProvider.ts) but nothing here
 * assumes that.
 */
export interface BillingProvider {
  startSubscription(input: StartSubscriptionInput): Promise<StartSubscriptionResult>;
}

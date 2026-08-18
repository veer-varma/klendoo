import type { BillingProvider, StartSubscriptionInput, StartSubscriptionResult } from "./types.js";

/**
 * Stripe billing for paid plans. Sprint 4 skeleton only — no Stripe
 * account or API key is provisioned anywhere in this project yet (checked
 * against Manus's environment handoff docs; not there). Same pattern as
 * Sprint 0's GoPlausibleFacilitator before real facilitator access
 * existed: build the shape, throw a clear error instead of guessing at
 * Stripe's actual request/response contract.
 *
 * STRIPE_SECRET_KEY is read but never logged or exposed — this class
 * never receives it from anywhere but the environment.
 */
export class StripeBillingProvider implements BillingProvider {
  constructor(private readonly apiKey: string | undefined = process.env.STRIPE_SECRET_KEY) {}

  async startSubscription(_input: StartSubscriptionInput): Promise<StartSubscriptionResult> {
    if (!this.apiKey) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set — cannot start a subscription. No Stripe account is " +
          "provisioned yet (see BACKLOG.md).",
      );
    }
    throw new Error(
      "StripeBillingProvider.startSubscription() is not implemented yet — needs a real Stripe " +
        "account to build against. Use a mock BillingProvider in tests until then.",
    );
  }
}

import { describe, expect, it } from "vitest";
import { StripeBillingProvider } from "./stripeBillingProvider.js";

const sampleInput = {
  hostEmail: "priya@priyaraman.coach",
  hostBusinessName: "Priya Raman Coaching",
  planKey: "entrepreneur",
  priceUsd: "49.99",
  billingInterval: "monthly",
};

describe("StripeBillingProvider", () => {
  it("throws a clear error when STRIPE_SECRET_KEY is not set", async () => {
    const provider = new StripeBillingProvider(undefined);
    await expect(provider.startSubscription(sampleInput)).rejects.toThrow("STRIPE_SECRET_KEY");
  });

  it("throws 'not implemented' once a key is present — no real Stripe account to build against yet", async () => {
    const provider = new StripeBillingProvider("sk_test_fake");
    await expect(provider.startSubscription(sampleInput)).rejects.toThrow("not implemented");
  });
});

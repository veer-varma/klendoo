import { describe, expect, it, vi, beforeEach } from "vitest";
import type { BillingProvider } from "./billing/types.js";

interface FixtureHost {
  id: string;
  status: string;
  email: string;
  businessName: string;
  plan: { key: string; priceUsd: string; billingInterval: string };
}

let hostFixture: FixtureHost;
const updates: Record<string, unknown>[] = [];

vi.mock("@klendoo/db", () => ({
  getDb: () => ({
    hostAccount: {
      findUnique: vi.fn(async () => hostFixture),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        updates.push(data);
        Object.assign(hostFixture, data);
        return hostFixture;
      }),
    },
  }),
}));

const { approveHost, rejectHost, HostNotPendingError } = await import("./approveHost.js");

function makeHost(overrides: Partial<FixtureHost> = {}): FixtureHost {
  return {
    id: "host-1",
    status: "PENDING",
    email: "priya@priyaraman.coach",
    businessName: "Priya Raman Coaching",
    plan: { key: "starter", priceUsd: "0.00", billingInterval: "monthly" },
    ...overrides,
  };
}

function mockBilling(): BillingProvider {
  return {
    startSubscription: vi.fn(async () => ({ customerId: "cus_123", subscriptionId: "sub_123" })),
  };
}

beforeEach(() => {
  updates.length = 0;
  hostFixture = makeHost();
});

describe("approveHost", () => {
  it("approves a free-plan host without touching billing", async () => {
    const billing = mockBilling();

    const host = await approveHost("host-1", billing);

    expect(host.status).toBe("APPROVED");
    expect(billing.startSubscription).not.toHaveBeenCalled();
  });

  it("starts a subscription before approving a paid-plan host", async () => {
    hostFixture = makeHost({ plan: { key: "entrepreneur", priceUsd: "49.99", billingInterval: "monthly" } });
    const billing = mockBilling();

    const host = await approveHost("host-1", billing);

    expect(billing.startSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ planKey: "entrepreneur", priceUsd: "49.99" }),
    );
    expect(host.status).toBe("APPROVED");
    expect(updates.at(-1)).toMatchObject({ stripeCustomerId: "cus_123", stripeSubscriptionId: "sub_123" });
  });

  it("throws if the host is not PENDING", async () => {
    hostFixture = makeHost({ status: "APPROVED" });
    await expect(approveHost("host-1", mockBilling())).rejects.toThrow(HostNotPendingError);
  });
});

describe("rejectHost", () => {
  it("marks a PENDING host REJECTED", async () => {
    const host = await rejectHost("host-1");
    expect(host.status).toBe("REJECTED");
  });

  it("throws if the host is not PENDING", async () => {
    hostFixture = makeHost({ status: "REJECTED" });
    await expect(rejectHost("host-1")).rejects.toThrow(HostNotPendingError);
  });
});

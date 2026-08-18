import { describe, expect, it, vi, beforeEach } from "vitest";

const updates: Record<string, unknown>[] = [];

vi.mock("@klendoo/db", () => ({
  getDb: () => ({
    plan: {
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = { id: where.id, ...data };
        updates.push(row);
        return row;
      }),
    },
  }),
}));

const { updatePlan, InvalidPlanPriceError } = await import("./updatePlan.js");

beforeEach(() => {
  updates.length = 0;
});

describe("updatePlan", () => {
  it("updates name/price/billingInterval/active", async () => {
    const plan = await updatePlan("plan-entrepreneur", {
      name: "Entrepreneur (Launch Discount)",
      priceUsd: "29.99",
      billingInterval: "monthly",
      active: true,
    });

    expect(plan).toMatchObject({
      name: "Entrepreneur (Launch Discount)",
      priceUsd: "29.99",
      active: true,
    });
  });

  it("rejects a negative price", async () => {
    await expect(
      updatePlan("plan-1", { name: "X", priceUsd: "-5", billingInterval: "monthly", active: true }),
    ).rejects.toThrow(InvalidPlanPriceError);
    expect(updates).toHaveLength(0);
  });

  it("rejects a non-numeric price", async () => {
    await expect(
      updatePlan("plan-1", { name: "X", priceUsd: "not-a-number", billingInterval: "monthly", active: true }),
    ).rejects.toThrow(InvalidPlanPriceError);
  });

  it("allows deactivating a plan", async () => {
    const plan = await updatePlan("plan-1", { name: "X", priceUsd: "0.00", billingInterval: "monthly", active: false });
    expect(plan.active).toBe(false);
  });
});

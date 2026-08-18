import { describe, expect, it, vi } from "vitest";

const upsertCalls: Record<string, unknown>[] = [];

vi.mock("@klendoo/db", () => ({
  getDb: () => ({
    plan: {
      upsert: vi.fn(async (args: Record<string, unknown>) => {
        upsertCalls.push(args);
        return args;
      }),
    },
  }),
}));

const { seedDefaultPlans } = await import("./seedPlans.js");

describe("seedDefaultPlans", () => {
  it("upserts starter (free) and entrepreneur ($49.99/month) by key, not overwriting on repeat runs", async () => {
    await seedDefaultPlans();

    expect(upsertCalls).toHaveLength(2);
    const starter = upsertCalls.find(
      (c) => (c.where as { key: string }).key === "starter",
    ) as { create: { priceUsd: string }; update: Record<string, unknown> };
    const entrepreneur = upsertCalls.find(
      (c) => (c.where as { key: string }).key === "entrepreneur",
    ) as { create: { priceUsd: string; billingInterval: string }; update: Record<string, unknown> };

    expect(starter.create.priceUsd).toBe("0.00");
    expect(starter.update).toEqual({}); // idempotent — never clobbers an admin's edits
    expect(entrepreneur.create.priceUsd).toBe("49.99");
    expect(entrepreneur.create.billingInterval).toBe("monthly");
  });
});

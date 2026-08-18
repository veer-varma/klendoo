import { describe, expect, it, vi, beforeEach } from "vitest";

const plans = new Map<string, Record<string, unknown>>([
  ["starter", { id: "plan-starter", key: "starter", active: true, priceUsd: "0.00" }],
  ["entrepreneur", { id: "plan-entrepreneur", key: "entrepreneur", active: true, priceUsd: "49.99" }],
  ["disabled", { id: "plan-disabled", key: "disabled", active: false, priceUsd: "9.99" }],
]);
const created: Record<string, unknown>[] = [];

vi.mock("@klendoo/db", () => ({
  getDb: () => ({
    plan: {
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => plans.get(where.key) ?? null),
    },
    hostAccount: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: "host-1", status: "PENDING", ...data };
        created.push(row);
        return row;
      }),
    },
  }),
}));

const { registerHost, PlanNotFoundError } = await import("./registerHost.js");

beforeEach(() => {
  created.length = 0;
});

describe("registerHost", () => {
  it("creates a PENDING host referencing the plan's id, not its key", async () => {
    const host = await registerHost({
      businessName: "Sable Studio Photography",
      email: "hana@sablestudio.co",
      slug: "sable-studio",
      planKey: "entrepreneur",
    });

    expect(host.status).toBe("PENDING");
    expect(created[0]).toMatchObject({ planId: "plan-entrepreneur", businessName: "Sable Studio Photography" });
  });

  it("throws PlanNotFoundError for an unknown plan key", async () => {
    await expect(
      registerHost({ businessName: "X", email: "x@example.com", slug: "x", planKey: "nonexistent" }),
    ).rejects.toThrow(PlanNotFoundError);
  });

  it("throws PlanNotFoundError for an inactive plan", async () => {
    await expect(
      registerHost({ businessName: "X", email: "x@example.com", slug: "x", planKey: "disabled" }),
    ).rejects.toThrow(PlanNotFoundError);
  });
});

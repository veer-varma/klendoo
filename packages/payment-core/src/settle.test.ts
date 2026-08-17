import { describe, expect, it, vi, beforeEach } from "vitest";

const clientInteractionStore = new Map<string, Record<string, unknown>>();

vi.mock("@klendoo/db", () => {
  return {
    getDb: () => ({
      platformSetting: {
        findUnique: vi.fn(async () => null),
      },
      clientInteraction: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const id = `test-${clientInteractionStore.size + 1}`;
          const row = { id, ...data };
          clientInteractionStore.set(id, row);
          return row;
        }),
        update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          const existing = clientInteractionStore.get(where.id) ?? {};
          const updated = { ...existing, ...data };
          clientInteractionStore.set(where.id, updated);
          return updated;
        }),
      },
    }),
  };
});

const { settle } = await import("./settle.js");

beforeEach(() => {
  clientInteractionStore.clear();
});

describe("settle", () => {
  it("logs a PENDING interaction, settles via the facilitator, and marks it SETTLED", async () => {
    const mockFacilitator = { settle: vi.fn(async () => ({ txnHash: "0xTESTHASH" })) };

    const result = await settle(
      "reminder",
      { amount: "0.15", network: "algorand-testnet", contextRef: "booking-123" },
      mockFacilitator,
    );

    expect(result.txnHash).toBe("0xTESTHASH");
    expect(result.amount).toBe("0.15");
    expect(result.currency).toBe("USDC");
    expect(mockFacilitator.settle).toHaveBeenCalledWith({
      actionType: "reminder",
      amount: "0.15",
      network: "algorand-testnet",
    });

    const stored = clientInteractionStore.get(result.interactionId);
    expect(stored?.status).toBe("SETTLED");
    expect(stored?.txnHash).toBe("0xTESTHASH");
  });

  it("marks the interaction FAILED and rethrows when the facilitator call fails", async () => {
    const failingFacilitator = {
      settle: vi.fn(async () => {
        throw new Error("facilitator unreachable");
      }),
    };

    await expect(
      settle("followup", { amount: "0.15" }, failingFacilitator),
    ).rejects.toThrow("facilitator unreachable");

    const [[, stored]] = Array.from(clientInteractionStore.entries());
    expect(stored.status).toBe("FAILED");
  });

  it("falls back to the env default price when no amount is passed and no PlatformSetting row exists", async () => {
    const mockFacilitator = { settle: vi.fn(async () => ({ txnHash: "0xFALLBACK" })) };
    const previous = process.env.DEFAULT_ACTION_PRICE_USDC;
    process.env.DEFAULT_ACTION_PRICE_USDC = "0.15";

    const result = await settle("booking", {}, mockFacilitator);

    expect(result.amount).toBe("0.15");

    if (previous === undefined) delete process.env.DEFAULT_ACTION_PRICE_USDC;
    else process.env.DEFAULT_ACTION_PRICE_USDC = previous;
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";

const edges = new Map<string, Record<string, unknown>>();
const key = (fromId: string, toId: string, actionType: string) => `${fromId}|${toId}|${actionType}`;

vi.mock("@klendoo/db", () => ({
  getDb: () => ({
    trustEdge: {
      findUnique: vi.fn(async ({ where }: { where: { fromId_toId_actionType: { fromId: string; toId: string; actionType: string } } }) => {
        const k = where.fromId_toId_actionType;
        return edges.get(key(k.fromId, k.toId, k.actionType)) ?? null;
      }),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { fromId_toId_actionType: { fromId: string; toId: string; actionType: string } };
          create: Record<string, unknown>;
          update: Record<string, unknown>;
        }) => {
          const k = where.fromId_toId_actionType;
          const id = key(k.fromId, k.toId, k.actionType);
          const existing = edges.get(id);
          if (!existing) {
            const row = { id, usageCount: 0, ...create };
            edges.set(id, row);
            return row;
          }
          const merged = { ...existing };
          for (const [field, value] of Object.entries(update)) {
            if (value && typeof value === "object" && "increment" in value) {
              merged[field] = (merged[field] as number) + (value as { increment: number }).increment;
            } else {
              merged[field] = value;
            }
          }
          edges.set(id, merged);
          return merged;
        },
      ),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = Array.from(edges.values()).find((e) => e.id === where.id);
        if (!existing) throw new Error("not found");
        Object.assign(existing, data);
        return existing;
      }),
    },
  }),
}));

const { getTrustEdge } = await import("./getTrustEdge.js");
const { upsertTrustEdge } = await import("./upsertTrustEdge.js");
const { recordEdgeUsage } = await import("./recordEdgeUsage.js");
const { revokeTrustEdge } = await import("./revokeTrustEdge.js");

beforeEach(() => {
  edges.clear();
});

describe("getTrustEdge", () => {
  it("returns null when no edge exists yet", async () => {
    expect(await getTrustEdge("host-1", "client@example.com", "reminder")).toBeNull();
  });
});

describe("upsertTrustEdge", () => {
  it("creates an edge with the given confidenceScore and reasoning", async () => {
    const edge = await upsertTrustEdge({
      fromId: "host-1",
      toId: "client@example.com",
      edgeType: "RELATIONSHIP",
      actionType: "reminder",
      confidenceScore: 0.6,
      reasoning: "repeat client",
    });
    expect(edge.confidenceScore).toBe(0.6);
    expect(edge.reasoning).toBe("repeat client");
  });

  it("updates confidenceScore on an existing edge without resetting usageCount", async () => {
    await recordEdgeUsage({ fromId: "host-1", toId: "client@example.com", edgeType: "RELATIONSHIP", actionType: "reminder" });
    await recordEdgeUsage({ fromId: "host-1", toId: "client@example.com", edgeType: "RELATIONSHIP", actionType: "reminder" });

    const updated = await upsertTrustEdge({
      fromId: "host-1",
      toId: "client@example.com",
      edgeType: "RELATIONSHIP",
      actionType: "reminder",
      confidenceScore: 0.9,
    });

    expect(updated.confidenceScore).toBe(0.9);
    expect(updated.usageCount).toBe(2); // untouched by upsertTrustEdge
  });
});

describe("recordEdgeUsage", () => {
  it("creates an edge with usageCount 1 on first use", async () => {
    const edge = await recordEdgeUsage({
      fromId: "host-1",
      toId: "client@example.com",
      edgeType: "RELATIONSHIP",
      actionType: "reminder",
    });
    expect(edge.usageCount).toBe(1);
    expect(edge.lastUsedAt).toBeInstanceOf(Date);
  });

  it("increments usageCount on repeated use of the same edge", async () => {
    await recordEdgeUsage({ fromId: "host-1", toId: "client@example.com", edgeType: "RELATIONSHIP", actionType: "reminder" });
    const second = await recordEdgeUsage({
      fromId: "host-1",
      toId: "client@example.com",
      edgeType: "RELATIONSHIP",
      actionType: "reminder",
    });
    expect(second.usageCount).toBe(2);
  });

  it("keeps edges for different actionTypes separate even for the same pair", async () => {
    await recordEdgeUsage({ fromId: "host-1", toId: "client@example.com", edgeType: "RELATIONSHIP", actionType: "reminder" });
    const negotiationEdge = await recordEdgeUsage({
      fromId: "host-1",
      toId: "client@example.com",
      edgeType: "RELATIONSHIP",
      actionType: "negotiation",
    });
    expect(negotiationEdge.usageCount).toBe(1);
  });
});

describe("revokeTrustEdge", () => {
  it("sets revokedAt and revokedReason", async () => {
    const created = await recordEdgeUsage({
      fromId: "host-1",
      toId: "client@example.com",
      edgeType: "RELATIONSHIP",
      actionType: "reminder",
    });
    const revoked = await revokeTrustEdge(created.id as string, "client requested no more contact");
    expect(revoked.revokedAt).toBeInstanceOf(Date);
    expect(revoked.revokedReason).toBe("client requested no more contact");
  });
});

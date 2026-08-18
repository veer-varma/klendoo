import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SettleResultContext, SettleFailureContext, HTTPTransportContext } from "@x402/core/server";

const clientInteractionStore = new Map<string, Record<string, unknown>>();

vi.mock("@klendoo/db", () => ({
  getDb: () => ({
    clientInteraction: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const id = `test-${clientInteractionStore.size + 1}`;
        const row = { id, ...data };
        clientInteractionStore.set(id, row);
        return row;
      }),
    },
  }),
}));

const { handleAfterSettle, handleSettleFailure, extractContextRef } = await import("./paidResource.js");

beforeEach(() => {
  clientInteractionStore.clear();
});

function fakeTransportContext(opts: { query?: Record<string, string>; body?: unknown }): HTTPTransportContext {
  return {
    request: {
      adapter: {
        getQueryParam: (name: string) => opts.query?.[name],
        getBody: () => opts.body,
      } as HTTPTransportContext["request"]["adapter"],
      path: "/agents/reminder",
      method: "GET",
    },
  } as HTTPTransportContext;
}

describe("extractContextRef", () => {
  it("reads contextRef from the query string (the Intermezzo gateway's actual transport — GET only, no body)", () => {
    const ctxRef = extractContextRef(fakeTransportContext({ query: { contextRef: "booking-42" } }));
    expect(ctxRef).toBe("booking-42");
  });

  it("falls back to the request body when no query param is present", () => {
    const ctxRef = extractContextRef(fakeTransportContext({ body: { contextRef: "booking-99" } }));
    expect(ctxRef).toBe("booking-99");
  });

  it("returns undefined when neither query nor body has contextRef", () => {
    expect(extractContextRef(fakeTransportContext({ query: { other: "field" } }))).toBeUndefined();
  });

  it("returns undefined when transportContext itself is missing", () => {
    expect(extractContextRef(undefined)).toBeUndefined();
  });
});

describe("handleAfterSettle", () => {
  it("logs a SETTLED ClientInteraction with the real txn hash and actionType from requirements.extra", async () => {
    const ctx = {
      requirements: { extra: { actionType: "reminder" }, amount: "150000", network: "algorand:testnet" },
      result: { success: true, transaction: "0xREALTXN", network: "algorand:testnet", amount: "150000" },
      transportContext: fakeTransportContext({ query: { contextRef: "booking-1" } }),
    } as unknown as SettleResultContext;

    await handleAfterSettle(ctx);

    const rows = Array.from(clientInteractionStore.values());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actionType: "reminder",
      amount: "150000",
      status: "SETTLED",
      txnHash: "0xREALTXN",
      contextRef: "booking-1",
    });
  });

  it("falls back to requirements.amount when result.amount is absent", async () => {
    const ctx = {
      requirements: { extra: {}, amount: "150000", network: "algorand:testnet" },
      result: { success: true, transaction: "0xTXN2", network: "algorand:testnet" },
      transportContext: undefined,
    } as unknown as SettleResultContext;

    await handleAfterSettle(ctx);

    const [row] = Array.from(clientInteractionStore.values());
    expect(row.amount).toBe("150000");
    expect(row.actionType).toBe("unknown");
  });
});

describe("handleSettleFailure", () => {
  it("logs a FAILED ClientInteraction with the error reason", async () => {
    const ctx = {
      requirements: { extra: { actionType: "reminder" }, amount: "150000", network: "algorand:testnet" },
      error: new Error("facilitator timeout"),
      transportContext: fakeTransportContext({ query: { contextRef: "booking-2" } }),
    } as unknown as SettleFailureContext;

    await handleSettleFailure(ctx);

    const [row] = Array.from(clientInteractionStore.values());
    expect(row.status).toBe("FAILED");
    expect(row.contextRef).toBe("booking-2");
  });
});

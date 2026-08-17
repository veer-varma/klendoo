import { describe, expect, it, vi, beforeEach } from "vitest";

const clientInteractionStore = new Map<string, Record<string, unknown>>();

vi.mock("@klendoo/db", () => ({
  getDb: () => ({
    platformSetting: { findUnique: vi.fn(async () => null) },
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
}));

import type { PostmarkClient } from "./postmark.js";

const { sendReminder } = await import("./sendReminder.js");
const { sampleBookingContext } = await import("./seedContexts.js");

beforeEach(() => {
  clientInteractionStore.clear();
  process.env.DEFAULT_ACTION_PRICE_USDC = "0.15";
});

describe("sendReminder", () => {
  it("sends the reminder email, then settles a reminder action referencing the context id", async () => {
    const context = sampleBookingContext({ id: "ctx-1", visitorEmail: "visitor@example.com" });
    const mockPostmark = {
      sendEmail: vi.fn(async () => ({ messageId: "msg-1" })),
    } as unknown as PostmarkClient;
    const mockFacilitator = { settle: vi.fn(async () => ({ txnHash: "0xTEST" })) };

    const result = await sendReminder(context, mockPostmark, mockFacilitator);

    expect(mockPostmark.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "visitor@example.com" }),
    );
    expect(result.emailMessageId).toBe("msg-1");
    expect(result.settlement.amount).toBe("0.15");

    const stored = clientInteractionStore.get(result.settlement.interactionId);
    expect(stored?.actionType).toBe("reminder");
    expect(stored?.contextRef).toBe("ctx-1");
    expect(stored?.status).toBe("SETTLED");
  });

  it("does not settle if the email send fails", async () => {
    const context = sampleBookingContext({ id: "ctx-2" });
    const failingPostmark = {
      sendEmail: vi.fn(async () => {
        throw new Error("Postmark unreachable");
      }),
    } as unknown as PostmarkClient;

    await expect(sendReminder(context, failingPostmark)).rejects.toThrow("Postmark unreachable");

    // No ClientInteraction should have been created for this context at all.
    const rows = Array.from(clientInteractionStore.values());
    expect(rows.find((r) => r.contextRef === "ctx-2")).toBeUndefined();
  });
});

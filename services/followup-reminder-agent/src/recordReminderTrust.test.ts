import { describe, expect, it, vi } from "vitest";

const recordEdgeUsage = vi.fn(async () => ({}));
vi.mock("@klendoo/trust-graph", () => ({ recordEdgeUsage }));

const { recordReminderTrust } = await import("./recordReminderTrust.js");
const { sampleBookingContext } = await import("./seedContexts.js");

describe("recordReminderTrust", () => {
  it("records usage between the host and visitor for the reminder action", async () => {
    const context = sampleBookingContext({ hostEmail: "priya@priyaraman.coach", visitorEmail: "alex@example.com" });

    await recordReminderTrust(context);

    expect(recordEdgeUsage).toHaveBeenCalledWith({
      fromId: "priya@priyaraman.coach",
      toId: "alex@example.com",
      edgeType: "RELATIONSHIP",
      actionType: "reminder",
    });
  });

  it("swallows a trust-write failure rather than throwing — must never break the reminder itself", async () => {
    recordEdgeUsage.mockRejectedValueOnce(new Error("db down"));
    const context = sampleBookingContext();
    await expect(recordReminderTrust(context)).resolves.toBeUndefined();
  });
});

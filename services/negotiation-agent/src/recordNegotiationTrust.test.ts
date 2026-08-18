import { describe, expect, it, vi } from "vitest";

const recordEdgeUsage = vi.fn(async () => ({}));
vi.mock("@klendoo/trust-graph", () => ({ recordEdgeUsage }));

const { recordNegotiationTrust } = await import("./recordNegotiationTrust.js");

describe("recordNegotiationTrust", () => {
  it("records one edge per confirmed attendee, not per invitee", async () => {
    await recordNegotiationTrust("priya@priyaraman.coach", ["alex@example.com", "jordan@example.com"]);

    expect(recordEdgeUsage).toHaveBeenCalledTimes(2);
    expect(recordEdgeUsage).toHaveBeenCalledWith({
      fromId: "priya@priyaraman.coach",
      toId: "alex@example.com",
      edgeType: "RELATIONSHIP",
      actionType: "negotiation",
    });
  });

  it("does nothing for an empty attendee list rather than erroring", async () => {
    recordEdgeUsage.mockClear();
    await recordNegotiationTrust("priya@priyaraman.coach", []);
    expect(recordEdgeUsage).not.toHaveBeenCalled();
  });

  it("continues recording remaining attendees even if one write fails", async () => {
    recordEdgeUsage.mockClear();
    recordEdgeUsage.mockRejectedValueOnce(new Error("db down")).mockResolvedValueOnce({});

    await recordNegotiationTrust("priya@priyaraman.coach", ["alex@example.com", "jordan@example.com"]);

    expect(recordEdgeUsage).toHaveBeenCalledTimes(2);
  });
});

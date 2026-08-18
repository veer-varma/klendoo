import { describe, expect, it } from "vitest";
import { contextToQueryString, contextFromQuery } from "./reminderContextQuery.js";
import { sampleBookingContext } from "./seedContexts.js";

describe("reminder context query round-trip", () => {
  it("survives a round trip through a query string", () => {
    const original = sampleBookingContext({ contextRef: "booking-7" });
    const query = new URLSearchParams(contextToQueryString(original));
    const parsed = contextFromQuery(Object.fromEntries(query.entries()));
    expect(parsed).toEqual(original);
  });

  it("throws a clear error when a required field is missing", () => {
    expect(() => contextFromQuery({ contextRef: "x" })).toThrow("hostName");
  });
});

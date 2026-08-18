import { describe, expect, it } from "vitest";
import { computeMajoritySlot } from "./majority.js";

const slots = [
  { id: "slot-1", startTime: "2026-08-20T14:00:00.000Z" },
  { id: "slot-2", startTime: "2026-08-19T10:00:00.000Z" }, // earlier, used for tie tests
  { id: "slot-3", startTime: "2026-08-21T09:00:00.000Z" },
];

describe("computeMajoritySlot", () => {
  it("picks the slot with the most available responses", () => {
    const result = computeMajoritySlot(slots, [
      { slotId: "slot-1", available: true },
      { slotId: "slot-1", available: true },
      { slotId: "slot-2", available: true },
    ]);
    expect(result).toEqual({ winningSlotId: "slot-1", availableCount: 2 });
  });

  it("breaks a tie by picking the earliest slot chronologically, not list order", () => {
    const result = computeMajoritySlot(slots, [
      { slotId: "slot-1", available: true },
      { slotId: "slot-2", available: true }, // slot-2 starts earlier than slot-1
    ]);
    expect(result?.winningSlotId).toBe("slot-2");
  });

  it("ignores unavailable responses entirely", () => {
    const result = computeMajoritySlot(slots, [
      { slotId: "slot-1", available: false },
      { slotId: "slot-1", available: false },
      { slotId: "slot-3", available: true },
    ]);
    expect(result?.winningSlotId).toBe("slot-3");
  });

  it("returns null when nobody marked anything available — not a zero-count winner", () => {
    const result = computeMajoritySlot(slots, [
      { slotId: "slot-1", available: false },
      { slotId: "slot-2", available: false },
    ]);
    expect(result).toBeNull();
  });

  it("returns null with no responses at all", () => {
    expect(computeMajoritySlot(slots, [])).toBeNull();
  });

  it("ignores responses referencing a slot id not in the given slot list", () => {
    const result = computeMajoritySlot(slots, [
      { slotId: "slot-1", available: true },
      { slotId: "stale-slot-from-elsewhere", available: true },
    ]);
    expect(result).toEqual({ winningSlotId: "slot-1", availableCount: 1 });
  });
});

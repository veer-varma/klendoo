import { describe, expect, it } from "vitest";
import { computeConfidence, deriveRepeatUsageFactor, deriveRecencyFactor } from "./computeConfidence.js";

describe("computeConfidence", () => {
  it("matches the spec's formula exactly for a known input", () => {
    // 0.4*1 + 0.3*0.5 + 0.2*0.5 + 0.1*1 = 0.4 + 0.15 + 0.1 + 0.1 = 0.75
    const score = computeConfidence({
      repeatUsageFactor: 1,
      calendarConflictCertainty: 0.5,
      responseReliability: 0.5,
      recencyFactor: 1,
    });
    expect(score).toBeCloseTo(0.75, 5);
  });

  it("scores 0 when every factor is 0", () => {
    expect(
      computeConfidence({
        repeatUsageFactor: 0,
        calendarConflictCertainty: 0,
        responseReliability: 0,
        recencyFactor: 0,
      }),
    ).toBe(0);
  });

  it("scores 1 when every factor is 1", () => {
    // toBeCloseTo, not toBe: 0.4+0.3+0.2+0.1 isn't bit-exact in IEEE 754
    // (comes out as 0.9999999999999999) — that's normal float behavior,
    // not a bug in computeConfidence.
    expect(
      computeConfidence({
        repeatUsageFactor: 1,
        calendarConflictCertainty: 1,
        responseReliability: 1,
        recencyFactor: 1,
      }),
    ).toBeCloseTo(1, 10);
  });

  it("clamps out-of-range factors instead of producing an out-of-range score", () => {
    const score = computeConfidence({
      repeatUsageFactor: 5, // way over 1
      calendarConflictCertainty: -2, // way under 0
      responseReliability: 0.5,
      recencyFactor: 0.5,
    });
    expect(score).toBeLessThanOrEqual(1);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe("deriveRepeatUsageFactor", () => {
  it("saturates at 1.0 by the 5th use, not linearly beyond it", () => {
    expect(deriveRepeatUsageFactor(0)).toBe(0);
    expect(deriveRepeatUsageFactor(5)).toBe(1);
    expect(deriveRepeatUsageFactor(50)).toBe(1); // clamped, not >1
  });

  it("is proportional below the saturation point", () => {
    expect(deriveRepeatUsageFactor(2)).toBeCloseTo(0.4, 5);
  });
});

describe("deriveRecencyFactor", () => {
  it("scores a never-used edge as 0, not a crash", () => {
    expect(deriveRecencyFactor(null)).toBe(0);
  });

  it("scores something used right now as close to 1", () => {
    const now = new Date("2026-08-18T00:00:00.000Z");
    expect(deriveRecencyFactor(now, now)).toBe(1);
  });

  it("decays toward 0 as the 90-day window elapses", () => {
    const now = new Date("2026-08-18T00:00:00.000Z");
    const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
    expect(deriveRecencyFactor(fortyFiveDaysAgo, now)).toBeCloseTo(0.5, 1);
  });

  it("floors at 0 past the decay window rather than going negative", () => {
    const now = new Date("2026-08-18T00:00:00.000Z");
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    expect(deriveRecencyFactor(yearAgo, now)).toBe(0);
  });
});

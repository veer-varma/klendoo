import { describe, expect, it, vi } from "vitest";

const settings = new Map<string, { value: string }>();

vi.mock("@klendoo/db", () => ({
  getDb: () => ({
    platformSetting: {
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => settings.get(where.key) ?? null),
    },
  }),
}));

const { classifyConfidence, getConfidenceThresholds } = await import("./confidenceThresholds.js");

describe("getConfidenceThresholds", () => {
  it("falls back to the spec's 0.8/0.5 defaults when no PlatformSetting rows exist", async () => {
    settings.clear();
    expect(await getConfidenceThresholds()).toEqual({ auto: 0.8, confirm: 0.5 });
  });

  it("uses PlatformSetting values when present, e.g. to validate against real data", async () => {
    settings.set("confidence_auto_threshold", { value: "0.9" });
    settings.set("confidence_confirm_threshold", { value: "0.6" });
    expect(await getConfidenceThresholds()).toEqual({ auto: 0.9, confirm: 0.6 });
    settings.clear();
  });
});

describe("classifyConfidence", () => {
  it("classifies at or above the auto threshold as auto", async () => {
    settings.clear();
    expect(await classifyConfidence(0.8)).toBe("auto");
    expect(await classifyConfidence(0.95)).toBe("auto");
  });

  it("classifies the confirm band as confirm, not auto", async () => {
    settings.clear();
    expect(await classifyConfidence(0.5)).toBe("confirm");
    expect(await classifyConfidence(0.79)).toBe("confirm");
  });

  it("classifies below the confirm threshold as manual", async () => {
    settings.clear();
    expect(await classifyConfidence(0.49)).toBe("manual");
    expect(await classifyConfidence(0)).toBe("manual");
  });
});

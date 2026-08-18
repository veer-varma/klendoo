import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@klendoo/payment-core", () => ({
  resolveNetwork: () => "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe",
  resolveDefaultPrice: vi.fn(async (actionType: string) => (actionType === "reminder" ? "0.15" : "0.20")),
}));

const { generateManifest } = await import("./generate.js");

beforeEach(() => {
  process.env.KLENDOO_PAYTO_ADDRESS = "TESTPAYTOADDRESS";
  process.env.PUBLIC_BASE_URL = "https://klendoo.com";
});

describe("generateManifest", () => {
  it("aggregates both agents' resources into one manifest, using each action's own price", async () => {
    const json = await generateManifest();
    const manifest = JSON.parse(json);

    expect(manifest.x402Version).toBe(2);
    expect(manifest.resources).toHaveLength(2);
    expect(manifest.resources.map((r: { url: string }) => r.url)).toEqual([
      "https://klendoo.com/agents/reminder",
      "https://klendoo.com/agents/negotiate",
    ]);
    // 0.15 USDC vs 0.20 USDC at 6 decimals — confirms per-action pricing, not a single shared amount.
    expect(manifest.resources[0].amount).toBe("150000");
    expect(manifest.resources[1].amount).toBe("200000");
  });

  it("throws a clear error when KLENDOO_PAYTO_ADDRESS is missing", async () => {
    delete process.env.KLENDOO_PAYTO_ADDRESS;
    await expect(generateManifest()).rejects.toThrow("KLENDOO_PAYTO_ADDRESS");
  });
});

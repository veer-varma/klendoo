import { describe, expect, it } from "vitest";
import { buildDiscoveryManifest } from "./buildManifest.js";

describe("buildDiscoveryManifest", () => {
  it("converts a decimal USD price to atomic USDC units", () => {
    const manifest = buildDiscoveryManifest([
      {
        url: "https://klendoo.com/agents/reminder",
        method: "GET",
        network: "testnet",
        priceUsd: "0.15",
        payTo: "SOMEADDRESS",
      },
    ]);

    expect(manifest.x402Version).toBe(2);
    // 0.15 USDC at 6 decimals = 150000 atomic units.
    expect(manifest.resources[0].amount).toBe("150000");
  });

  it("picks the testnet vs mainnet CAIP-2 network id and USDC asset id correctly", () => {
    const manifest = buildDiscoveryManifest([
      { url: "https://x", method: "GET", network: "testnet", priceUsd: "0.15", payTo: "A" },
      { url: "https://y", method: "GET", network: "mainnet", priceUsd: "0.15", payTo: "A" },
    ]);

    const [testnetResource, mainnetResource] = manifest.resources;
    expect(testnetResource.network).not.toBe(mainnetResource.network);
    expect(testnetResource.asset).not.toBe(mainnetResource.asset);
  });

  it("lists every resource passed in, preserving url/method/payTo", () => {
    const manifest = buildDiscoveryManifest([
      { url: "https://klendoo.com/agents/reminder", method: "GET", network: "testnet", priceUsd: "0.15", payTo: "ADDR1" },
      { url: "https://klendoo.com/agents/negotiate", method: "GET", network: "testnet", priceUsd: "0.15", payTo: "ADDR1" },
    ]);

    expect(manifest.resources).toHaveLength(2);
    expect(manifest.resources.map((r) => r.url)).toEqual([
      "https://klendoo.com/agents/reminder",
      "https://klendoo.com/agents/negotiate",
    ]);
  });
});

#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getNetworkFromCaip2 } from "@x402/avm";
import { resolveNetwork, resolveDefaultPrice } from "@klendoo/payment-core";
import { buildDiscoveryManifest, type ManifestResourceInput } from "@klendoo/bazaar-listing";

const OUTPUT_DIR = path.resolve(process.cwd(), "public/.well-known");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "x402");

function requirePayToAddress(): string {
  const address = process.env.KLENDOO_PAYTO_ADDRESS;
  if (!address) throw new Error("KLENDOO_PAYTO_ADDRESS is not set.");
  return address;
}

function requirePublicBaseUrl(): string {
  const url = process.env.PUBLIC_BASE_URL;
  if (!url) throw new Error("PUBLIC_BASE_URL is not set.");
  return url.replace(/\/$/, "");
}

/**
 * Aggregates every paid service's resource into one manifest — the actual
 * artifact the Trust Graph Spec §2 describes ("packages/bazaar-listing/
 * manifest.json"). Each service also serves its own single-resource
 * manifest at its own /.well-known/x402 (see their server.ts); this one is
 * for whichever origin ends up serving the public domain root once
 * deployment is real — still unresolved, see BACKLOG.md.
 *
 * Static generation, same pattern as ../transparency/generate.ts — no
 * server here, just a file an eventual reverse-proxy config can serve.
 */
export async function generateManifest(): Promise<string> {
  const payToAddress = requirePayToAddress();
  const publicBaseUrl = requirePublicBaseUrl();
  const network: "testnet" | "mainnet" = getNetworkFromCaip2(resolveNetwork()) === "mainnet" ? "mainnet" : "testnet";

  const resources: ManifestResourceInput[] = [
    {
      url: `${publicBaseUrl}/agents/reminder`,
      method: "GET",
      network,
      priceUsd: await resolveDefaultPrice("reminder"),
      payTo: payToAddress,
    },
    {
      url: `${publicBaseUrl}/agents/negotiate`,
      method: "GET",
      network,
      priceUsd: await resolveDefaultPrice("negotiation"),
      payTo: payToAddress,
    },
  ];

  return JSON.stringify(buildDiscoveryManifest(resources), null, 2);
}

async function main() {
  const manifest = await generateManifest();
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, manifest, "utf8");
  console.log(`Wrote aggregated x402 discovery manifest to ${OUTPUT_FILE}`);
}

if (process.argv[1]?.endsWith("generate.js") && process.argv[1]?.includes("wellKnown")) {
  main().catch((err) => {
    console.error("Failed to generate discovery manifest:", err);
    process.exitCode = 1;
  });
}

import { convertToTokenAmount } from "@x402/core/utils";
import {
  ALGORAND_MAINNET_GENESIS_HASH,
  ALGORAND_TESTNET_GENESIS_HASH,
  USDC_MAINNET_ASA_ID,
  USDC_TESTNET_ASA_ID,
  USDC_DECIMALS,
} from "@x402/avm";

// @x402/avm's own exported ALGORAND_MAINNET_CAIP2/ALGORAND_TESTNET_CAIP2 are
// truncated (confirmed against the live facilitator, 2026-08-19, still
// present in 2.23.0 — see packages/payment-core/src/network.ts for the full
// writeup) — build the correct CAIP-2 string from the package's own
// (correct) genesis-hash constants instead of its broken derived ones.
const ALGORAND_MAINNET_CAIP2 = `algorand:${ALGORAND_MAINNET_GENESIS_HASH}`;
const ALGORAND_TESTNET_CAIP2 = `algorand:${ALGORAND_TESTNET_GENESIS_HASH}`;

/** One paid endpoint to list — the input shape callers build from their route config. */
export interface ManifestResourceInput {
  url: string;
  method: string;
  /** "testnet" | "mainnet" — kept simple rather than requiring the caller to
   * already know the CAIP-2 string. */
  network: "testnet" | "mainnet";
  /** Decimal USD price, e.g. "0.15" — same units PlatformSetting stores. */
  priceUsd: string;
  payTo: string;
}

export interface ManifestResource {
  url: string;
  method: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
}

export interface DiscoveryManifest {
  x402Version: 2;
  resources: ManifestResource[];
}

function toResource(input: ManifestResourceInput): ManifestResource {
  const isMainnet = input.network === "mainnet";
  return {
    url: input.url,
    method: input.method,
    network: isMainnet ? ALGORAND_MAINNET_CAIP2 : ALGORAND_TESTNET_CAIP2,
    asset: isMainnet ? USDC_MAINNET_ASA_ID : USDC_TESTNET_ASA_ID,
    amount: convertToTokenAmount(input.priceUsd, USDC_DECIMALS),
    payTo: input.payTo,
  };
}

/**
 * Builds the `/.well-known/x402` discovery document — matches the shape
 * GoPlausible's own discovery guide documents (confirmed against
 * facilitator.goplausible.xyz/guide/discovery's real example, not guessed).
 */
export function buildDiscoveryManifest(resources: ManifestResourceInput[]): DiscoveryManifest {
  return {
    x402Version: 2,
    resources: resources.map(toResource),
  };
}

import { ALGORAND_MAINNET_CAIP2, ALGORAND_TESTNET_CAIP2 } from "@x402/avm";
import type { Network } from "@x402/core/types";

export { ALGORAND_MAINNET_CAIP2, ALGORAND_TESTNET_CAIP2 };

/**
 * Which Algorand network Klendoo's paid endpoints settle against.
 *
 * Defaults to testnet. Per Manus's "Claude Development Handoff — Klendoo"
 * (2026-08-17): "Mainnet ... Explicitly not authorized. Requires successful
 * TestNet settlement and fresh written authorization." Do not flip this
 * default without that authorization existing first.
 */
export function resolveNetwork(): Network {
  const env = process.env.ALGOD_NETWORK;
  return env === "mainnet" || env === "algorand-mainnet"
    ? ALGORAND_MAINNET_CAIP2
    : ALGORAND_TESTNET_CAIP2;
}

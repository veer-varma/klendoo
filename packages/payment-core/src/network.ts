import { ALGORAND_MAINNET_GENESIS_HASH, ALGORAND_TESTNET_GENESIS_HASH } from "@x402/avm";
import type { Network } from "@x402/core/types";

/**
 * Real bug in @x402/avm (confirmed against the live facilitator, 2026-08-19,
 * still present in the latest published version, 2.23.0): its own exported
 * `ALGORAND_MAINNET_CAIP2`/`ALGORAND_TESTNET_CAIP2` constants are truncated
 * to 32 characters of the base64 genesis hash instead of the full 44 —
 * e.g. testnet's is `algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe`, missing
 * the trailing `xi9/cOUJOiI=`. The live GoPlausible facilitator's own
 * /supported endpoint returns the full, correct string — a resource server
 * initialized with the package's truncated constant gets a hard
 * `RouteConfigurationError: missing_facilitator` at startup because the
 * facilitator's supported-kinds list never has an exact match.
 *
 * Built here from the package's own (correct) exported genesis-hash
 * constants instead of trusting its derived CAIP-2 constant — still using
 * official package data, just not the one field that's wrong. @x402/avm's
 * own `getNetworkFromCaip2`/`normalizeAlgorandNetwork` already accept this
 * full form as equivalent to their truncated one, so nothing downstream
 * (ours or theirs) needed to change to consume it.
 */
export const ALGORAND_MAINNET_CAIP2 = `algorand:${ALGORAND_MAINNET_GENESIS_HASH}` as Network;
export const ALGORAND_TESTNET_CAIP2 = `algorand:${ALGORAND_TESTNET_GENESIS_HASH}` as Network;

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

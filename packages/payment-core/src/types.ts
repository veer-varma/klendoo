/**
 * Mirrors TrustEdge.actionType from Klendoo_Product_Definition_Trust_Graph_Spec.md §1
 * so payment-core and the future trust-graph package share one vocabulary.
 */
export type ActionType =
  | "booking"
  | "negotiation"
  | "followup"
  | "reminder"
  | "spend";

export type Network = "algorand-testnet" | "algorand-mainnet";

export interface SettleOptions {
  /** Overrides the PlatformSetting-derived default price for this one call. */
  amount?: string;
  /** Defaults to ALGOD_NETWORK env, which defaults to testnet. */
  network?: Network;
  /** Free-form pointer to the booking/context record this settlement is for. */
  contextRef?: string;
}

export interface SettlementResult {
  txnHash: string;
  amount: string;
  currency: "USDC";
  network: Network;
  interactionId: string;
}

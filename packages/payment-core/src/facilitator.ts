import type { ActionType, Network } from "./types.js";

export interface FacilitatorSettleRequest {
  actionType: ActionType;
  amount: string;
  network: Network;
}

export interface FacilitatorSettleResponse {
  txnHash: string;
}

/**
 * Abstraction over the x402 payment facilitator. GoPlausible is the only
 * implementation today, but this interface exists specifically so it can be
 * swapped without touching callers — GoPlausible is flagged in the
 * Development Plan's risk table as the highest-risk dependency (newer, less
 * battle-tested than Algorand core).
 */
export interface Facilitator {
  settle(
    request: FacilitatorSettleRequest,
  ): Promise<FacilitatorSettleResponse>;
}

/**
 * GoPlausible x402 facilitator client.
 *
 * Sprint 0 skeleton only — the actual HTTP call against GoPlausible's API is
 * not wired up yet (that's Sprint 1, per Klendoo_Sprint_Plan.md: "Reminder
 * agent core logic; payment SDK settle() call against testnet"). The API key
 * is read from GOPLAUSIBLE_API_KEY, provisioned by the Ops Agent — this code
 * never receives or logs the raw key value.
 */
export class GoPlausibleFacilitator implements Facilitator {
  constructor(private readonly apiKey: string | undefined = process.env.GOPLAUSIBLE_API_KEY) {}

  async settle(
    _request: FacilitatorSettleRequest,
  ): Promise<FacilitatorSettleResponse> {
    if (!this.apiKey) {
      throw new Error(
        "GOPLAUSIBLE_API_KEY is not set — cannot settle against the GoPlausible facilitator.",
      );
    }
    throw new Error(
      "GoPlausibleFacilitator.settle() is not implemented yet — Sprint 1 wires this up against " +
        "the real GoPlausible x402 API. Use a mock Facilitator in tests until then.",
    );
  }
}

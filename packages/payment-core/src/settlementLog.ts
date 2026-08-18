import { getDb } from "@klendoo/db";

export interface RecordSettlementInput {
  actionType: string;
  amount: string;
  network: string;
  txnHash: string;
  contextRef?: string;
}

/**
 * Logs a real, already-settled x402 payment to ClientInteraction. Unlike
 * Sprint 0/1's settle(), there is no "pending" phase we control here — x402
 * is buyer-initiated and verify+settle happen inside the facilitator's
 * single round trip, so we only ever learn about a payment after the fact,
 * via the resource server's onAfterSettle hook (see paidResource.ts).
 */
export async function recordSettlement(input: RecordSettlementInput) {
  return getDb().clientInteraction.create({
    data: {
      actionType: input.actionType,
      amount: input.amount,
      network: input.network,
      status: "SETTLED",
      txnHash: input.txnHash,
      contextRef: input.contextRef,
      settledAt: new Date(),
    },
  });
}

export interface RecordSettlementFailureInput {
  actionType: string;
  amount: string;
  network: string;
  reason: string;
  contextRef?: string;
}

export async function recordSettlementFailure(input: RecordSettlementFailureInput) {
  return getDb().clientInteraction.create({
    data: {
      actionType: input.actionType,
      amount: input.amount,
      network: input.network,
      status: "FAILED",
      contextRef: input.contextRef,
    },
  });
}

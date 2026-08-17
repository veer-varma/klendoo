export interface SettlementRow {
  interactionId: string;
  actionType: string;
  amount: string;
  currency: string;
  network: string;
  txnHash: string;
  settledAt: string;
}

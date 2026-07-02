export type ActionType = 'booking' | 'follow-up' | 'reminder';
export interface SettlementRequest {
    hostAddress: string;
    actionType: ActionType;
    amount: number;
    note?: string;
}
export interface SettlementResponse {
    success: boolean;
    transactionHash?: string;
    error?: string;
    timestamp: number;
    confirmationTime?: number;
}
export interface PaymentFeeEstimate {
    algorandGasFee: number;
    x402ProtocolFee: number;
    klendooFee: number;
    totalCost: number;
}
export interface AnalyticsEvent {
    eventType: 'settlement_initiated' | 'settlement_confirmed' | 'settlement_failed' | 'spending_auth_requested';
    hostAddress: string;
    actionType: ActionType;
    amount: number;
    timestamp: number;
    metadata?: Record<string, unknown>;
}
//# sourceMappingURL=types.d.ts.map
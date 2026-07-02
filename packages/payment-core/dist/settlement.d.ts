import { SettlementResponse, PaymentFeeEstimate, AnalyticsEvent, ActionType } from './types';
export declare class SettlementSDK {
    private goplausible;
    private wallet;
    private analyticsEvents;
    constructor(goplausibleApiKey?: string);
    settle(hostAddress: string, actionType: ActionType, amount: number, note?: string): Promise<SettlementResponse>;
    connectWallet(provider: 'pera' | 'defly' | 'myalgo'): Promise<string>;
    requestSpendingAuthorization(cap: number): Promise<boolean>;
    requiresSpendingAuth(): boolean;
    estimateFees(baseAmount: number): PaymentFeeEstimate;
    getAnalyticsEvents(): Promise<AnalyticsEvent[]>;
    clearAnalyticsEvents(): void;
    private logAnalytics;
    getWalletState(): Promise<import("./wallet").WalletState>;
    disconnectWallet(): Promise<void>;
}
export default SettlementSDK;
//# sourceMappingURL=settlement.d.ts.map
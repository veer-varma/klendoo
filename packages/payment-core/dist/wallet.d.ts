export type WalletProvider = 'pera' | 'defly' | 'myalgo';
export interface WalletAccount {
    address: string;
    name: string;
    provider: WalletProvider;
}
export interface WalletState {
    isConnected: boolean;
    account: WalletAccount | null;
    balance: number;
    spendingAuthorizationCap: number;
}
export declare class WalletManager {
    private state;
    connect(provider: WalletProvider): Promise<WalletAccount>;
    private connectPera;
    private connectDefly;
    private connectMyAlgo;
    requestSpendingAuthorization(cap: number): Promise<boolean>;
    requiresSpendingAuth(): boolean;
    getState(): WalletState;
    fetchBalance(): Promise<number>;
    disconnect(): void;
}
//# sourceMappingURL=wallet.d.ts.map
export interface AlgorandConfig {
    mainnetRpcUrl: string;
    testnetRpcUrl: string;
    networkToken: string;
}
export interface GoPlausibleConfig {
    apiUrl: string;
    apiKey: string;
}
export declare const ALGORAND_CONFIG: AlgorandConfig;
export declare const GOPLAUSIBLE_CONFIG: GoPlausibleConfig;
export declare const SETTLEMENT_CONFIG: {
    retryAttempts: number;
    retryDelayMs: number;
    settlementConfirmationTimeoutMs: number;
    analyticsEnabled: boolean;
};
//# sourceMappingURL=config.d.ts.map
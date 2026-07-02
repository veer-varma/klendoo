"use strict";
// Copyright (c) 2026 Veer Varma. All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.SETTLEMENT_CONFIG = exports.GOPLAUSIBLE_CONFIG = exports.ALGORAND_CONFIG = void 0;
exports.ALGORAND_CONFIG = {
    mainnetRpcUrl: process.env.ALGORAND_MAINNET_RPC || 'https://mainnet-api.algonode.cloud',
    testnetRpcUrl: process.env.ALGORAND_TESTNET_RPC || 'https://testnet-api.algonode.cloud',
    networkToken: process.env.ALGORAND_TOKEN || ''
};
exports.GOPLAUSIBLE_CONFIG = {
    apiUrl: process.env.GOPLAUSIBLE_API_URL || 'https://api.goplausible.com',
    apiKey: process.env.GOPLAUSIBLE_API_KEY || ''
};
exports.SETTLEMENT_CONFIG = {
    retryAttempts: 3,
    retryDelayMs: 1000,
    settlementConfirmationTimeoutMs: 30000,
    analyticsEnabled: process.env.ANALYTICS_ENABLED !== 'false'
};
//# sourceMappingURL=config.js.map
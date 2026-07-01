// Copyright (c) 2026 Veer Varma. All rights reserved.

export interface AlgorandConfig {
  mainnetRpcUrl: string;
  testnetRpcUrl: string;
  networkToken: string;
}

export interface GoPlausibleConfig {
  apiUrl: string;
  apiKey: string;
}

export const ALGORAND_CONFIG: AlgorandConfig = {
  mainnetRpcUrl: process.env.ALGORAND_MAINNET_RPC || 'https://mainnet-api.algonode.cloud',
  testnetRpcUrl: process.env.ALGORAND_TESTNET_RPC || 'https://testnet-api.algonode.cloud',
  networkToken: process.env.ALGORAND_TOKEN || ''
};

export const GOPLAUSIBLE_CONFIG: GoPlausibleConfig = {
  apiUrl: process.env.GOPLAUSIBLE_API_URL || 'https://api.goplausible.com',
  apiKey: process.env.GOPLAUSIBLE_API_KEY || ''
};

export const SETTLEMENT_CONFIG = {
  retryAttempts: 3,
  retryDelayMs: 1000,
  settlementConfirmationTimeoutMs: 30000,
  analyticsEnabled: process.env.ANALYTICS_ENABLED !== 'false'
};

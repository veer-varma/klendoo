"use strict";
// Copyright (c) 2026 Veer Varma. All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementSDK = void 0;
const config_1 = require("./config");
const goplausible_1 = require("./goplausible");
const wallet_1 = require("./wallet");
class SettlementSDK {
    constructor(goplausibleApiKey) {
        this.analyticsEvents = [];
        this.goplausible = new goplausible_1.GoPlausibleX402Client(goplausibleApiKey);
        this.wallet = new wallet_1.WalletManager();
    }
    async settle(hostAddress, actionType, amount, note) {
        const request = {
            hostAddress,
            actionType,
            amount,
            note
        };
        this.logAnalytics({
            eventType: 'settlement_initiated',
            hostAddress,
            actionType,
            amount,
            timestamp: Date.now()
        });
        try {
            const paymentRequest = await this.goplausible.createPaymentRequest(request);
            const response = await this.goplausible.retryPayment(paymentRequest.requestId);
            if (response.success) {
                this.logAnalytics({
                    eventType: 'settlement_confirmed',
                    hostAddress,
                    actionType,
                    amount,
                    timestamp: Date.now(),
                    metadata: { transactionHash: response.transactionHash }
                });
            }
            else {
                this.logAnalytics({
                    eventType: 'settlement_failed',
                    hostAddress,
                    actionType,
                    amount,
                    timestamp: Date.now(),
                    metadata: { error: response.error }
                });
            }
            return response;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logAnalytics({
                eventType: 'settlement_failed',
                hostAddress,
                actionType,
                amount,
                timestamp: Date.now(),
                metadata: { error: errorMessage }
            });
            return {
                success: false,
                error: errorMessage,
                timestamp: Date.now()
            };
        }
    }
    async connectWallet(provider) {
        const account = await this.wallet.connect(provider);
        return account.address;
    }
    async requestSpendingAuthorization(cap) {
        if (this.wallet.requiresSpendingAuth()) {
            this.logAnalytics({
                eventType: 'spending_auth_requested',
                hostAddress: this.wallet.getState().account?.address || '',
                actionType: 'booking',
                amount: cap,
                timestamp: Date.now()
            });
            return await this.wallet.requestSpendingAuthorization(cap);
        }
        return true;
    }
    requiresSpendingAuth() {
        return this.wallet.requiresSpendingAuth();
    }
    estimateFees(baseAmount) {
        const algorandGasFee = 0.001;
        const x402ProtocolFee = baseAmount * 0.02;
        const klendooFee = baseAmount * 0.10;
        return {
            algorandGasFee,
            x402ProtocolFee,
            klendooFee,
            totalCost: baseAmount + algorandGasFee + x402ProtocolFee + klendooFee
        };
    }
    async getAnalyticsEvents() {
        if (!config_1.SETTLEMENT_CONFIG.analyticsEnabled)
            return [];
        return [...this.analyticsEvents];
    }
    clearAnalyticsEvents() {
        this.analyticsEvents = [];
    }
    logAnalytics(event) {
        if (config_1.SETTLEMENT_CONFIG.analyticsEnabled) {
            this.analyticsEvents.push(event);
            console.log('[Settlement Analytics]', event);
        }
    }
    async getWalletState() {
        return this.wallet.getState();
    }
    async disconnectWallet() {
        this.wallet.disconnect();
    }
}
exports.SettlementSDK = SettlementSDK;
exports.default = SettlementSDK;
//# sourceMappingURL=settlement.js.map
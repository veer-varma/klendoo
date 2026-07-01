"use strict";
// Copyright (c) 2026 Veer Varma. All rights reserved.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoPlausibleX402Client = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("./config");
class GoPlausibleX402Client {
    constructor(apiKey) {
        this.client = axios_1.default.create({
            baseURL: config_1.GOPLAUSIBLE_CONFIG.apiUrl,
            headers: {
                'Authorization': `Bearer ${apiKey || config_1.GOPLAUSIBLE_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }
    async createPaymentRequest(request) {
        const response = await this.client.post('/x402/request', {
            recipient: request.hostAddress,
            amount: request.amount,
            action: request.actionType,
            note: request.note || `Klendoo ${request.actionType} settlement`
        });
        return {
            requestId: response.data.id,
            x402Header: response.data.x402_header,
            amount: response.data.amount,
            recipient: response.data.recipient
        };
    }
    async confirmPayment(requestId, transactionHash) {
        try {
            const response = await this.client.post(`/x402/confirm/${requestId}`, {
                txn_hash: transactionHash
            });
            return response.data.confirmed === true;
        }
        catch (error) {
            return false;
        }
    }
    async getPaymentStatus(requestId) {
        const response = await this.client.get(`/x402/status/${requestId}`);
        return {
            status: response.data.status,
            transactionHash: response.data.txn_hash,
            confirmationTime: response.data.confirmation_time
        };
    }
    async retryPayment(requestId) {
        let lastError = null;
        for (let attempt = 1; attempt <= config_1.SETTLEMENT_CONFIG.retryAttempts; attempt++) {
            try {
                const status = await this.getPaymentStatus(requestId);
                if (status.status === 'confirmed') {
                    return {
                        success: true,
                        transactionHash: status.transactionHash,
                        timestamp: Date.now(),
                        confirmationTime: status.confirmationTime
                    };
                }
                if (status.status === 'failed') {
                    throw new Error('Payment failed at GoPlausible');
                }
                if (attempt < config_1.SETTLEMENT_CONFIG.retryAttempts) {
                    await this.delay(config_1.SETTLEMENT_CONFIG.retryDelayMs * attempt);
                }
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (attempt === config_1.SETTLEMENT_CONFIG.retryAttempts)
                    break;
            }
        }
        return {
            success: false,
            error: lastError?.message || 'Payment confirmation failed after retries',
            timestamp: Date.now()
        };
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.GoPlausibleX402Client = GoPlausibleX402Client;
//# sourceMappingURL=goplausible.js.map
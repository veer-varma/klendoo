"use strict";
// Copyright (c) 2026 Veer Varma. All rights reserved.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.X402Middleware = void 0;
const config_1 = require("./config");
const axios_1 = __importDefault(require("axios"));
class X402Middleware {
    /**
     * Generate x402 payment request header
     * Returns the header that should be sent as HTTP 402 Payment Required
     */
    static generateX402Header(request) {
        const payRequest = {
            recipient: request.recipient,
            amount: request.amount,
            action: request.action,
            note: request.note || '',
            facilitator: config_1.GOPLAUSIBLE_CONFIG.apiUrl,
            timestamp: Date.now()
        };
        return {
            statusCode: 402,
            headers: {
                'X-402-Pay-To': request.recipient,
                'X-402-Amount': request.amount.toString(),
                'X-402-Action': request.action,
                'X-402-Pay-Request': Buffer.from(JSON.stringify(payRequest)).toString('base64')
            },
            body: {
                error: 'Payment Required',
                paymentRequired: true,
                facilitator: config_1.GOPLAUSIBLE_CONFIG.apiUrl,
                instructions: `Send ${request.amount} USDC to ${request.recipient} via x402 protocol. Use facilitator: ${config_1.GOPLAUSIBLE_CONFIG.apiUrl}`
            }
        };
    }
    /**
     * Verify x402 payment proof from client
     */
    static async verifyPaymentProof(paymentId, expectedAmount, expectedRecipient) {
        try {
            const response = await axios_1.default.get(`${config_1.GOPLAUSIBLE_CONFIG.apiUrl}/x402/verify/${paymentId}`, {
                headers: {
                    'Authorization': `Bearer ${config_1.GOPLAUSIBLE_CONFIG.apiKey}`
                }
            });
            const proof = response.data;
            if (proof.amount === expectedAmount &&
                proof.recipient === expectedRecipient &&
                proof.confirmed === true) {
                return {
                    x402PaymentId: proof.id,
                    transactionHash: proof.txn_hash,
                    amount: proof.amount,
                    recipient: proof.recipient,
                    timestamp: proof.timestamp,
                    confirmed: proof.confirmed
                };
            }
            return null;
        }
        catch (error) {
            console.error('Error verifying payment proof:', error);
            return null;
        }
    }
    /**
     * Extract x402 payment ID from request headers
     */
    static extractPaymentId(headers) {
        return headers['x-402-payment-id'] || headers['authorization']?.split(' ')[1] || null;
    }
    /**
     * Check if request has valid x402 payment proof
     */
    static async hasValidPayment(headers, expectedAmount, expectedRecipient) {
        const paymentId = this.extractPaymentId(headers);
        if (!paymentId)
            return false;
        const proof = await this.verifyPaymentProof(paymentId, expectedAmount, expectedRecipient);
        return proof !== null;
    }
}
exports.X402Middleware = X402Middleware;
//# sourceMappingURL=x402-middleware.js.map
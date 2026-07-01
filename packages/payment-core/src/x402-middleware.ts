// Copyright (c) 2026 Veer Varma. All rights reserved.

import { GOPLAUSIBLE_CONFIG } from './config';
import axios from 'axios';

export interface X402Request {
  amount: number;
  recipient: string;
  action: string;
  note?: string;
}

export interface X402PaymentProof {
  x402PaymentId: string;
  transactionHash: string;
  amount: number;
  recipient: string;
  timestamp: number;
  confirmed: boolean;
}

export class X402Middleware {
  /**
   * Generate x402 payment request header
   * Returns the header that should be sent as HTTP 402 Payment Required
   */
  static generateX402Header(request: X402Request): {
    statusCode: 402;
    headers: {
      'X-402-Pay-To': string;
      'X-402-Amount': string;
      'X-402-Action': string;
      'X-402-Pay-Request': string;
    };
    body: {
      error: string;
      paymentRequired: true;
      facilitator: string;
      instructions: string;
    };
  } {
    const payRequest = {
      recipient: request.recipient,
      amount: request.amount,
      action: request.action,
      note: request.note || '',
      facilitator: GOPLAUSIBLE_CONFIG.apiUrl,
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
        facilitator: GOPLAUSIBLE_CONFIG.apiUrl,
        instructions: `Send ${request.amount} USDC to ${request.recipient} via x402 protocol. Use facilitator: ${GOPLAUSIBLE_CONFIG.apiUrl}`
      }
    };
  }

  /**
   * Verify x402 payment proof from client
   */
  static async verifyPaymentProof(
    paymentId: string,
    expectedAmount: number,
    expectedRecipient: string
  ): Promise<X402PaymentProof | null> {
    try {
      const response = await axios.get(
        `${GOPLAUSIBLE_CONFIG.apiUrl}/x402/verify/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${GOPLAUSIBLE_CONFIG.apiKey}`
          }
        }
      );

      const proof = response.data;

      if (
        proof.amount === expectedAmount &&
        proof.recipient === expectedRecipient &&
        proof.confirmed === true
      ) {
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
    } catch (error) {
      console.error('Error verifying payment proof:', error);
      return null;
    }
  }

  /**
   * Extract x402 payment ID from request headers
   */
  static extractPaymentId(headers: Record<string, string>): string | null {
    return headers['x-402-payment-id'] || headers['authorization']?.split(' ')[1] || null;
  }

  /**
   * Check if request has valid x402 payment proof
   */
  static async hasValidPayment(
    headers: Record<string, string>,
    expectedAmount: number,
    expectedRecipient: string
  ): Promise<boolean> {
    const paymentId = this.extractPaymentId(headers);
    if (!paymentId) return false;

    const proof = await this.verifyPaymentProof(paymentId, expectedAmount, expectedRecipient);
    return proof !== null;
  }
}

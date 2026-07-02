// Copyright (c) 2026 Veer Varma. All rights reserved.

import axios, { AxiosInstance } from 'axios';
import { GOPLAUSIBLE_CONFIG, SETTLEMENT_CONFIG } from './config';
import { SettlementRequest, SettlementResponse } from './types';

export class GoPlausibleX402Client {
  private client: AxiosInstance;

  constructor(apiKey?: string) {
    this.client = axios.create({
      baseURL: GOPLAUSIBLE_CONFIG.apiUrl,
      headers: {
        'Authorization': `Bearer ${apiKey || GOPLAUSIBLE_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createPaymentRequest(request: SettlementRequest): Promise<{
    requestId: string;
    x402Header: string;
    amount: number;
    recipient: string;
  }> {
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

  async confirmPayment(requestId: string, transactionHash: string): Promise<boolean> {
    try {
      const response = await this.client.post(`/x402/confirm/${requestId}`, {
        txn_hash: transactionHash
      });
      return response.data.confirmed === true;
    } catch (error) {
      return false;
    }
  }

  async getPaymentStatus(requestId: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    transactionHash?: string;
    confirmationTime?: number;
  }> {
    const response = await this.client.get(`/x402/status/${requestId}`);
    return {
      status: response.data.status,
      transactionHash: response.data.txn_hash,
      confirmationTime: response.data.confirmation_time
    };
  }

  async retryPayment(requestId: string): Promise<SettlementResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= SETTLEMENT_CONFIG.retryAttempts; attempt++) {
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

        if (attempt < SETTLEMENT_CONFIG.retryAttempts) {
          await this.delay(SETTLEMENT_CONFIG.retryDelayMs * attempt);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt === SETTLEMENT_CONFIG.retryAttempts) break;
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Payment confirmation failed after retries',
      timestamp: Date.now()
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

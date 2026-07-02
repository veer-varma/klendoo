// Copyright (c) 2026 Veer Varma. All rights reserved.

import { SettlementSDK } from './settlement';
import { GoPlausibleX402Client } from './goplausible';
import { WalletManager } from './wallet';

jest.mock('./goplausible');
jest.mock('./wallet');

describe('SettlementSDK', () => {
  let sdk: SettlementSDK;
  let mockGoplausible: jest.Mocked<GoPlausibleX402Client>;
  let mockWallet: jest.Mocked<WalletManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    sdk = new SettlementSDK('test-api-key');
    mockGoplausible = GoPlausibleX402Client as jest.MockedClass<typeof GoPlausibleX402Client>;
    mockWallet = WalletManager as jest.MockedClass<typeof WalletManager>;
  });

  describe('settle', () => {
    it('should successfully settle a payment', async () => {
      const mockResponse = {
        success: true,
        transactionHash: 'ABC123',
        timestamp: Date.now(),
        confirmationTime: 5000
      };

      jest.spyOn(sdk as any, 'goplausible').mockReturnValue({
        createPaymentRequest: jest.fn().mockResolvedValue({
          requestId: 'req-123',
          x402Header: 'x402-header',
          amount: 0.05,
          recipient: 'ADDR123'
        }),
        retryPayment: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await sdk.settle('ADDR123', 'booking', 0.05);

      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('ABC123');
    });

    it('should handle settlement failure with retry', async () => {
      const mockResponse = {
        success: false,
        error: 'Payment failed after retries',
        timestamp: Date.now()
      };

      jest.spyOn(sdk as any, 'goplausible').mockReturnValue({
        createPaymentRequest: jest.fn().mockResolvedValue({
          requestId: 'req-123',
          x402Header: 'x402-header',
          amount: 0.05,
          recipient: 'ADDR123'
        }),
        retryPayment: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await sdk.settle('ADDR123', 'follow-up', 0.02);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should log analytics events', async () => {
      jest.spyOn(sdk as any, 'goplausible').mockReturnValue({
        createPaymentRequest: jest.fn().mockResolvedValue({
          requestId: 'req-123',
          x402Header: 'x402-header',
          amount: 0.05,
          recipient: 'ADDR123'
        }),
        retryPayment: jest.fn().mockResolvedValue({
          success: true,
          transactionHash: 'ABC123',
          timestamp: Date.now()
        })
      });

      await sdk.settle('ADDR123', 'booking', 0.05);

      const events = await sdk.getAnalyticsEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.eventType === 'settlement_initiated')).toBe(true);
    });
  });

  describe('fee estimation', () => {
    it('should estimate fees correctly', () => {
      const estimate = sdk.estimateFees(0.05);

      expect(estimate.algorandGasFee).toBe(0.001);
      expect(estimate.x402ProtocolFee).toBeCloseTo(0.001);
      expect(estimate.klendooFee).toBeCloseTo(0.005);
      expect(estimate.totalCost).toBeCloseTo(0.057);
    });

    it('should handle different base amounts', () => {
      const estimate1 = sdk.estimateFees(0.02);
      const estimate2 = sdk.estimateFees(0.03);

      expect(estimate2.klendooFee).toBeGreaterThan(estimate1.klendooFee);
    });
  });

  describe('spending authorization', () => {
    it('should check if spending auth is required', async () => {
      jest.spyOn(sdk as any, 'wallet').mockReturnValue({
        requiresSpendingAuth: jest.fn().mockReturnValue(true)
      });

      expect(sdk.requiresSpendingAuth()).toBe(true);
    });

    it('should request spending authorization', async () => {
      jest.spyOn(sdk as any, 'wallet').mockReturnValue({
        requiresSpendingAuth: jest.fn().mockReturnValue(true),
        requestSpendingAuthorization: jest.fn().mockResolvedValue(true)
      });

      const result = await sdk.requestSpendingAuthorization(1.0);
      expect(result).toBe(true);
    });
  });

  describe('wallet management', () => {
    it('should connect wallet', async () => {
      jest.spyOn(sdk as any, 'wallet').mockReturnValue({
        connect: jest.fn().mockResolvedValue({
          address: 'NEWADDR123',
          name: 'Pera Wallet',
          provider: 'pera'
        })
      });

      const address = await sdk.connectWallet('pera');
      expect(address).toBe('NEWADDR123');
    });

    it('should disconnect wallet', async () => {
      jest.spyOn(sdk as any, 'wallet').mockReturnValue({
        disconnect: jest.fn()
      });

      await sdk.disconnectWallet();
    });
  });

  describe('analytics', () => {
    it('should clear analytics events', async () => {
      sdk.clearAnalyticsEvents();
      const events = await sdk.getAnalyticsEvents();
      expect(events.length).toBe(0);
    });
  });
});

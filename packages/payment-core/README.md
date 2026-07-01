# @klendoo/payment-core

USDC settlement SDK for Algorand micropayments via x402 protocol.

## Features

- **Wallet Integration**: Support for Pera, Defly, and MyAlgo wallets
- **x402 Protocol**: GoPlausible integration for HTTP 402 Payment Required micropayments
- **Retry Logic**: Automatic retry with exponential backoff for failed settlements
- **Fee Estimation**: Calculate total costs including Algorand gas, protocol fees, and Klendoo margin
- **Analytics**: Built-in event logging for all settlement operations

## Installation

```bash
npm install @klendoo/payment-core
```

## Usage

```typescript
import { SettlementSDK } from '@klendoo/payment-core';

const sdk = new SettlementSDK(process.env.GOPLAUSIBLE_API_KEY);

// Connect wallet
const address = await sdk.connectWallet('pera');

// Request spending authorization
await sdk.requestSpendingAuthorization(10.0);

// Settle a payment
const result = await sdk.settle(
  'HOSTADDRESS123',
  'booking',
  0.05,
  'Booking confirmation payment'
);

if (result.success) {
  console.log('Settlement confirmed:', result.transactionHash);
}
```

## API

### SettlementSDK

#### `settle(hostAddress, actionType, amount, note?)`
Initiates and completes a settlement with retry logic.

**Parameters:**
- `hostAddress` (string): Algorand address of payment recipient
- `actionType` ('booking' | 'follow-up' | 'reminder'): Type of action triggering settlement
- `amount` (number): Amount in USDC
- `note` (string, optional): Payment note

**Returns:** `Promise<SettlementResponse>`

#### `estimateFees(baseAmount)`
Calculates total cost including all fees.

**Returns:** `PaymentFeeEstimate`

#### `connectWallet(provider)`
Connects to a user's wallet.

**Parameters:**
- `provider` ('pera' | 'defly' | 'myalgo')

**Returns:** `Promise<string>` (wallet address)

#### `requestSpendingAuthorization(cap)`
Requests permission to spend up to `cap` amount.

**Returns:** `Promise<boolean>`

#### `getAnalyticsEvents()`
Returns logged analytics events.

**Returns:** `Promise<AnalyticsEvent[]>`

## Testing

```bash
npm test
```

Coverage target: 80%+

## Environment Variables

See `.env.example` for required configuration.

## Copyright

Copyright (c) 2026 Veer Varma. All rights reserved.

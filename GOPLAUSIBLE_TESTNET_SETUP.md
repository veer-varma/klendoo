# GoPlausible x402 Testnet Setup Guide

**Status:** Integration guide for testing Klendoo on Algorand testnet via GoPlausible

---

## Overview

GoPlausible acts as your **x402 payment facilitator**, handling:
- HTTP 402 Payment Required responses
- Payment request generation
- Algorand transaction processing
- Payment verification
- Testnet/Mainnet switching

---

## Step 1: GoPlausible Account Setup

### Create GoPlausible Account
1. Go to https://goplausible.com
2. Sign up for developer account
3. Create API key in dashboard
4. Note your API endpoint URL

### Get Testnet Credentials
GoPlausible provides:
- **Testnet RPC:** Algorand testnet node
- **Test USDC:** Testnet USDC mint address
- **API Endpoint:** https://api.goplausible.com/testnet (or staging)

---

## Step 2: Update .env Configuration

```bash
# GoPlausible Configuration
GOPLAUSIBLE_API_URL=https://api.goplausible.com/testnet
GOPLAUSIBLE_API_KEY=your_goplausible_api_key_here
GOPLAUSIBLE_ENVIRONMENT=testnet

# Algorand Testnet
ALGORAND_MAINNET_RPC=https://testnet-api.algonode.cloud
ALGORAND_TESTNET_RPC=https://testnet-api.algonode.cloud
ALGORAND_NETWORK=testnet
ALGORAND_TOKEN=

# Host Wallet (for receiving payments on testnet)
HOST_WALLET_ADDRESS=your_testnet_wallet_address
HOST_WALLET_MNEMONIC=your_testnet_wallet_mnemonic
```

---

## Step 3: Create Test Wallets

### For Host
```bash
# Generate testnet wallet
goal account new

# Fund with testnet ALGO
# Go to: https://dispenser.testnet.algorand.network/
# Paste wallet address, request faucet funds

# Verify balance
goal account info -a <your_address>
```

### For Visitor
Create a second wallet for testing visitor USDC payments.

---

## Step 4: Configure Klendoo for Testnet

Update `packages/payment-core/src/config.ts`:

```typescript
export const ALGORAND_CONFIG: AlgorandConfig = {
  mainnetRpcUrl: 'https://testnet-api.algonode.cloud', // Note: testnet
  testnetRpcUrl: 'https://testnet-api.algonode.cloud',
  networkToken: ''
};

export const GOPLAUSIBLE_CONFIG: GoPlausibleConfig = {
  apiUrl: process.env.GOPLAUSIBLE_API_URL || 'https://api.goplausible.com/testnet',
  apiKey: process.env.GOPLAUSIBLE_API_KEY || ''
};
```

---

## Step 5: Test x402 Payment Flow

### Test Booking Agent Payment

```bash
# 1. Start local server
npm run dev

# 2. Make booking request WITHOUT payment
curl -X POST http://localhost:3000/api/agents/booking \
  -H "Content-Type: application/json" \
  -d '{
    "visitorName": "Test Visitor",
    "visitorEmail": "test@example.com",
    "hostId": "host123",
    "hostAddress": "YOUR_TESTNET_WALLET",
    "preferredTimes": ["2026-07-02T10:00:00Z"],
    "sessionType": "coaching",
    "duration": 60
  }'

# Response: HTTP 402 Payment Required
# Headers include:
# X-402-Pay-To: YOUR_TESTNET_WALLET
# X-402-Amount: 0.05
# X-402-Pay-Request: base64_encoded_request
```

### Process x402 Payment

```bash
# 3. Make payment through GoPlausible
# Use GoPlausible SDK or API:
curl -X POST https://api.goplausible.com/testnet/x402/pay \
  -H "Authorization: Bearer $GOPLAUSIBLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0.05,
    "recipient": "YOUR_TESTNET_WALLET",
    "action": "booking",
    "payer_address": "VISITOR_TESTNET_WALLET"
  }'

# Response: { "paymentId": "pay_xyz123", "txnHash": "ABC..." }
```

### Retry with Payment Proof

```bash
# 4. Retry booking with payment proof
curl -X POST http://localhost:3000/api/agents/booking \
  -H "Content-Type: application/json" \
  -H "X-402-Payment-ID: pay_xyz123" \
  -d '{
    "visitorName": "Test Visitor",
    "visitorEmail": "test@example.com",
    "hostId": "host123",
    "hostAddress": "YOUR_TESTNET_WALLET",
    "preferredTimes": ["2026-07-02T10:00:00Z"],
    "sessionType": "coaching",
    "duration": 60
  }'

# Response: HTTP 200 OK
# { "success": true, "bookingId": "...", "calendarEventId": "..." }
```

---

## Step 6: Verify Testnet Transactions

### Check Algorand Testnet Explorer
1. Go to https://testnet.algoexplorer.io
2. Search for wallet address
3. View transaction history
4. Verify 0.05 USDC received

### Query GoPlausible Payment Status
```bash
curl -X GET https://api.goplausible.com/testnet/x402/status/pay_xyz123 \
  -H "Authorization: Bearer $GOPLAUSIBLE_API_KEY"

# Response:
# {
#   "id": "pay_xyz123",
#   "status": "confirmed",
#   "txn_hash": "ABC...",
#   "amount": 0.05,
#   "recipient": "YOUR_TESTNET_WALLET",
#   "timestamp": 1719...
# }
```

---

## Step 7: Test All Three Microagents

### Booking Agent ($0.05)
```bash
POST /api/agents/booking
X-402-Amount: 0.05
# Requires payment before execution
```

### Follow-up Agent ($0.02)
```bash
POST /api/agents/follow-up
X-402-Amount: 0.02
# Triggers after payment verified
```

### Reminder Agent ($0.03)
```bash
POST /api/agents/reminder
X-402-Amount: 0.03
# Triggers after payment verified
```

---

## Testing Checklist

- [ ] GoPlausible API key working
- [ ] Testnet wallet funded with ALGO
- [ ] Booking request returns HTTP 402
- [ ] x402 headers correct (amount, recipient, action)
- [ ] Payment processed via GoPlausible
- [ ] Retry with payment ID succeeds
- [ ] Booking created in Google Calendar
- [ ] Confirmation email sent
- [ ] Transaction visible on testnet explorer
- [ ] All three agents work with payments
- [ ] Retry logic handles failed payments
- [ ] Analytics events logged

---

## Troubleshooting

### "402 Payment Required" Never Succeeds
- Check API key validity
- Verify wallet address format
- Ensure payment amount matches request

### Transaction Not Confirming
- Check GoPlausible API status
- Verify testnet RPC is responding
- Check wallet has sufficient ALGO for gas

### Email Not Sending
- Verify SMTP credentials in .env
- Check email spam folder
- Enable "Less Secure Apps" for Gmail

### Calendar Integration Failing
- Verify Google OAuth scopes
- Check calendar access token validity
- Ensure host account has Google Calendar

---

## Switching to Mainnet

Once testing complete, update `.env`:

```bash
# Change to Mainnet
GOPLAUSIBLE_API_URL=https://api.goplausible.com
ALGORAND_MAINNET_RPC=https://mainnet-api.algonode.cloud
ALGORAND_NETWORK=mainnet
```

⚠️ **WARNING:** Mainnet transactions are REAL. Start with small test amounts ($0.001 USD).

---

## GoPlausible x402 Flow Diagram

```
Client Request (without payment)
        ↓
Booking Agent (x402 Middleware)
        ↓
Has valid payment? NO
        ↓
Return HTTP 402 Payment Required
Include X-402 Headers + GoPlausible endpoint
        ↓
Client calls GoPlausible API with payment
        ↓
GoPlausible processes x402 on Algorand (testnet)
        ↓
Returns paymentId + txnHash
        ↓
Client retries request with X-402-Payment-ID header
        ↓
Booking Agent verifies payment via GoPlausible
        ↓
Payment confirmed? YES
        ↓
Execute booking agent logic
Create calendar event + send email
        ↓
Return HTTP 200 OK + result
```

---

## Next Steps

1. **Set up GoPlausible account** (today)
2. **Fund testnet wallets** (today)
3. **Test booking flow** (tomorrow during deployment)
4. **Verify all 3 agents** (during pilot testing)
5. **Switch to Mainnet** (before public launch)

---

## Support

- GoPlausible Docs: https://docs.goplausible.com/x402
- Algorand Testnet Faucet: https://dispenser.testnet.algorand.network/
- Algorand Testnet Explorer: https://testnet.algoexplorer.io

---

**Copyright (c) 2026 Veer Varma. All rights reserved.**

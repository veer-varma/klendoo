# Klendoo x402 Architecture & Integration

**Status:** Complete x402 payment gating with GoPlausible facilitator  
**Testnet Ready:** Algorand testnet with GoPlausible  
**Latest Commit:** `36b881a` - x402 Payment Gating Implementation

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│              Client/Visitor/Host                      │
│         (Web App, Mobile, API Client)                │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│         Klendoo Microagent Endpoint                   │
│     (POST /api/agents/booking)                        │
├──────────────────────────────────────────────────────┤
│              x402Middleware Check                     │
│  "Do you have payment proof in headers?"             │
├──────────────────────────────────────────────────────┤
│         NO PAYMENT?           │        PAYMENT OK?    │
│              ↓                │            ↓          │
│   Generate HTTP 402          │    Execute Agent      │
│   Include x402 Headers       │    - Create calendar  │
│   Point to GoPlausible       │    - Send email       │
│              │               │    - Log transaction  │
│              ↓               │            ↓          │
│   Return 402 response   │    Return 200 OK         │
│   + Payment Instructions│    + Result              │
└──────────────────┬──────────┬──────────────────────┘
                   │          │
                   ▼          │
┌──────────────────────────────────────────────────────┐
│         GoPlausible x402 Facilitator                  │
│     (https://api.goplausible.com/testnet)            │
├──────────────────────────────────────────────────────┤
│  1. Receive x402 payment request from client         │
│  2. Return payment instructions + endpoint           │
│  3. Client makes payment via wallet                  │
│  4. GoPlausible submits to Algorand network          │
│  5. Return paymentId + txnHash                       │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│         Algorand Testnet / Mainnet                    │
│              Network                                  │
├──────────────────────────────────────────────────────┤
│  Execute transaction:                                │
│  - Payer: Visitor/Host wallet                        │
│  - Recipient: Klendoo host address                   │
│  - Amount: 0.05 USDC (or ALGO on testnet)           │
│  - Confirms within seconds                           │
└──────────────────────────────────────────────────────┘
```

---

## Request/Response Flow

### Step 1: Initial Request (No Payment)

```http
POST /api/agents/booking HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "visitorName": "John Doe",
  "visitorEmail": "john@example.com",
  "hostId": "host123",
  "hostAddress": "ALGO_WALLET_ADDRESS",
  "preferredTimes": ["2026-07-02T10:00:00Z"],
  "sessionType": "coaching",
  "duration": 60
}
```

### Step 2: Server Responds (Payment Required)

```http
HTTP/1.1 402 Payment Required
Content-Type: application/json
X-402-Pay-To: ALGO_WALLET_ADDRESS
X-402-Amount: 0.05
X-402-Action: booking
X-402-Pay-Request: eyJyZWNpcGllbnQiOi...

{
  "error": "Payment Required",
  "paymentRequired": true,
  "facilitator": "https://api.goplausible.com/testnet",
  "instructions": "Send 0.05 USDC to ALGO_WALLET_ADDRESS via x402 protocol"
}
```

### Step 3: Client Makes Payment

```bash
# Client calls GoPlausible to make payment
curl -X POST https://api.goplausible.com/testnet/x402/pay \
  -H "Authorization: Bearer API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0.05,
    "recipient": "ALGO_WALLET_ADDRESS",
    "action": "booking",
    "payer_address": "VISITOR_WALLET"
  }'

# GoPlausible Response:
# {
#   "paymentId": "pay_xyz123",
#   "txnHash": "ABC123DEF456...",
#   "status": "confirmed",
#   "timestamp": 1719...
# }
```

### Step 4: Client Retries with Payment Proof

```http
POST /api/agents/booking HTTP/1.1
Host: localhost:3000
Content-Type: application/json
X-402-Payment-ID: pay_xyz123

{
  "visitorName": "John Doe",
  "visitorEmail": "john@example.com",
  "hostId": "host123",
  "hostAddress": "ALGO_WALLET_ADDRESS",
  "preferredTimes": ["2026-07-02T10:00:00Z"],
  "sessionType": "coaching",
  "duration": 60
}
```

### Step 5: Server Executes (Payment Verified)

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "bookingId": "booking-1719...",
  "calendarEventId": "event-abc123",
  "transactionHash": "ABC123DEF456..."
}
```

---

## Microagent Pricing (Testnet)

| Agent | Cost | Trigger | Settlement |
|-------|------|---------|------------|
| **Booking** | 0.05 ALGO* | When visitor books | Immediate |
| **Follow-up** | 0.02 ALGO* | 24h after booking | Automatic |
| **Reminder** | 0.03 ALGO* | 1h before session | Automatic |

*On testnet; switches to USDC on Mainnet by changing `.env`

---

## Code Implementation

### x402Middleware (Payment Gating)

```typescript
// Check if payment is required
const paymentCheck = await X402Middleware.hasValidPayment(
  headers,
  0.05,                    // amount
  hostAddress              // recipient
);

if (!paymentCheck) {
  // Return HTTP 402 with payment instructions
  return X402Middleware.generateX402Header({
    amount: 0.05,
    recipient: hostAddress,
    action: 'booking',
    note: 'Booking agent invocation'
  });
}

// Payment verified - execute agent logic
return agent.handle(request);
```

### Microagent Handler

```typescript
async handle(request: BookingRequest, headers: Record<string, string>) {
  // Check payment requirement
  const paymentCheck = await this.checkPaymentRequirement(
    headers,
    request.hostAddress
  );

  if (!paymentCheck.authorized) {
    return paymentCheck.response; // Return 402
  }

  // Payment verified - execute booking logic
  const availableSlot = await this.findAvailableSlot(...);
  const calendarEventId = await this.createCalendarEvent(...);
  await this.sendConfirmationEmail(...);

  return {
    success: true,
    bookingId: `booking-${Date.now()}`,
    calendarEventId
  };
}
```

---

## GoPlausible Configuration

### Environment Variables

```bash
# GoPlausible
GOPLAUSIBLE_API_URL=https://api.goplausible.com/testnet
GOPLAUSIBLE_API_KEY=your_api_key

# Algorand Network
ALGORAND_NETWORK=testnet
ALGORAND_MAINNET_RPC=https://testnet-api.algonode.cloud

# Host Wallet
HOST_WALLET_ADDRESS=your_testnet_wallet
```

### Switching to Mainnet

Change just these environment variables:

```bash
GOPLAUSIBLE_API_URL=https://api.goplausible.com  # Remove /testnet
ALGORAND_NETWORK=mainnet
ALGORAND_MAINNET_RPC=https://mainnet-api.algonode.cloud
```

No code changes needed!

---

## Testnet Workflow (Tomorrow)

### 1. Setup (15 mins)
```bash
# Create testnet wallet
goal account new

# Fund via faucet
# https://dispenser.testnet.algorand.network/

# Update .env with wallet address
```

### 2. Test Booking Payment (5 mins)
```bash
# Request without payment → HTTP 402
curl -X POST http://localhost:3000/api/agents/booking \
  -H "Content-Type: application/json" \
  -d '{...}'

# Expected: HTTP 402 + x402 headers
```

### 3. Process Payment via GoPlausible (5 mins)
```bash
# Make payment through GoPlausible API
curl -X POST https://api.goplausible.com/testnet/x402/pay \
  -H "Authorization: Bearer API_KEY" \
  -d '{...}'

# Expected: paymentId + txnHash
```

### 4. Retry with Proof (5 mins)
```bash
# Retry with payment ID in headers
curl -X POST http://localhost:3000/api/agents/booking \
  -H "X-402-Payment-ID: pay_xyz123" \
  -d '{...}'

# Expected: HTTP 200 OK + booking created
```

### 5. Verify on Testnet Explorer (5 mins)
```bash
# View transaction on testnet explorer
# https://testnet.algoexplorer.io/tx/ABC123...

# Expected: 0.05 ALGO transferred to host wallet
```

---

## Key Files

| File | Purpose |
|------|---------|
| `packages/payment-core/src/x402-middleware.ts` | Payment gating logic |
| `services/booking-agent/src/handler.ts` | x402-gated booking agent |
| `GOPLAUSIBLE_TESTNET_SETUP.md` | Complete testnet setup guide |
| `X402_ARCHITECTURE.md` | This file - architecture reference |

---

## Security Considerations

1. **Payment Verification**
   - Always verify paymentId with GoPlausible API
   - Check amount matches expected value
   - Confirm recipient is correct wallet
   - Only proceed if status = "confirmed"

2. **Header Validation**
   - Extract payment ID from headers carefully
   - Validate header format
   - Handle missing headers gracefully

3. **Testnet vs Mainnet**
   - Testnet uses ALGO for testing
   - Mainnet uses real USDC
   - Always test thoroughly on testnet first
   - Use small amounts initially on mainnet

4. **Rate Limiting**
   - Implement rate limiting on agent endpoints
   - Prevent payment spam/abuse
   - Log all failed payment attempts

---

## Debugging Checklist

- [ ] GoPlausible API key valid
- [ ] Testnet RPC responding
- [ ] Wallet address in correct format
- [ ] Payment ID returned after payment
- [ ] x402 headers present in HTTP 402 response
- [ ] Payment verification succeeds on retry
- [ ] Calendar event created after payment
- [ ] Email sent successfully
- [ ] Transaction visible on testnet explorer
- [ ] All 3 agents work with x402 gating

---

## Architecture Benefits

✅ **x402 Standard Compliant** - Follows HTTP 402 Payment Required spec  
✅ **Micropayment Facilitator** - GoPlausible handles blockchain interaction  
✅ **Testnet Ready** - Easy switching between testnet and mainnet  
✅ **Idempotent** - Can retry payments safely  
✅ **Transparent** - Clear payment flow to users  
✅ **Scalable** - Works for any number of microagents  
✅ **Cost Efficient** - Algorand gas fees negligible on testnet  

---

**Copyright (c) 2026 Veer Varma. All rights reserved.**

---

**Next:** Deploy tomorrow and test the complete x402 flow on testnet!

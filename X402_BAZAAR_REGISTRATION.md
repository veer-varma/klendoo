// Copyright (c) 2026 Veer Varma. All rights reserved.

# x402 Bazaar Registration Guide

**What is the x402 Bazaar?**
The x402 Bazaar is a public registry of x402-enabled endpoints. It allows:
- Clients to discover micropayment services
- Payment facilitators to locate endpoints
- Services to announce their x402 availability
- Users to find available x402 resources

---

## Klendoo Endpoints to Register

### 1. Booking Agent
```
Endpoint: https://klendoo.app/api/agents/booking
Amount: 0.05 USDC
Action: booking
Description: Create calendar event + send confirmation email
Recipient: host_wallet_address
Network: Algorand (testnet first, then mainnet)
```

### 2. Follow-up Agent
```
Endpoint: https://klendoo.app/api/agents/follow-up
Amount: 0.02 USDC
Action: follow-up
Description: Send follow-up email to visitor (24h post-booking)
Recipient: host_wallet_address
Network: Algorand
```

### 3. Reminder Agent
```
Endpoint: https://klendoo.app/api/agents/reminder
Amount: 0.03 USDC
Action: reminder
Description: Send session reminder email (1h pre-session)
Recipient: host_wallet_address
Network: Algorand
```

---

## Registration Steps

### Step 1: Prepare Endpoint Metadata

For each endpoint, you need:

```json
{
  "name": "Klendoo Booking Agent",
  "description": "Create calendar event and send booking confirmation email",
  "endpoint": "https://klendoo.app/api/agents/booking",
  "method": "POST",
  "amount": 0.05,
  "currency": "USDC",
  "blockchain": "algorand",
  "networks": ["testnet", "mainnet"],
  "action": "booking",
  "recipient": "YOUR_KLENDOO_HOST_WALLET",
  "organization": "Klendoo Inc",
  "contact": "contact@klendoo.app",
  "documentation": "https://klendoo.app/docs/api",
  "rate_limit": "100 per day per wallet",
  "timeout": 30,
  "retry_policy": "3 attempts with exponential backoff",
  "payment_processor": "GoPlausible"
}
```

### Step 2: Register on x402 Bazaar

#### Option A: API Registration (Programmatic)

```bash
curl -X POST https://bazaar.x402.io/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://klendoo.app/api/agents/booking",
    "metadata": {
      "name": "Klendoo Booking Agent",
      "amount": 0.05,
      "action": "booking",
      "organization": "Klendoo",
      "contact": "contact@klendoo.app"
    },
    "signature": "SIGNATURE_OF_ENDPOINT_OWNER"
  }'
```

#### Option B: Web Portal Registration

1. Go to https://bazaar.x402.io
2. Click "Register Endpoint"
3. Fill in:
   - Endpoint URL
   - Amount in USDC
   - Action type
   - Organization name
   - Contact email
4. Click "Submit"
5. Verify ownership (they'll send verification email)

#### Option C: Manual Registration (via GoPlausible)

Since GoPlausible is your facilitator:

```bash
curl -X POST https://api.goplausible.com/bazaar/register \
  -H "Authorization: Bearer YOUR_GOPLAUSIBLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoints": [
      {
        "url": "https://klendoo.app/api/agents/booking",
        "amount": 0.05,
        "action": "booking",
        "network": "algorand",
        "recipient": "YOUR_WALLET"
      },
      {
        "url": "https://klendoo.app/api/agents/follow-up",
        "amount": 0.02,
        "action": "follow-up",
        "network": "algorand",
        "recipient": "YOUR_WALLET"
      },
      {
        "url": "https://klendoo.app/api/agents/reminder",
        "amount": 0.03,
        "action": "reminder",
        "network": "algorand",
        "recipient": "YOUR_WALLET"
      }
    ]
  }'
```

### Step 3: Verify Endpoint Compliance

The Bazaar will check:
- ✅ Endpoint returns HTTP 402 when not paid
- ✅ Includes proper x402 headers
- ✅ Accepts payment proof in headers
- ✅ Executes logic after payment verified

### Step 4: Enable Testnet Registration First

Before mainnet:
```json
{
  "network": "testnet",
  "status": "testing",
  "endpoints": [
    "https://klendoo-testnet.app/api/agents/booking",
    "https://klendoo-testnet.app/api/agents/follow-up",
    "https://klendoo-testnet.app/api/agents/reminder"
  ]
}
```

Once tested and working, update to:
```json
{
  "network": "mainnet",
  "status": "production",
  "endpoints": [
    "https://klendoo.app/api/agents/booking",
    "https://klendoo.app/api/agents/follow-up",
    "https://klendoo.app/api/agents/reminder"
  ]
}
```

---

## x402 Bazaar Discovery

Once registered, clients can discover your endpoints:

### Search Bazaar
```bash
# Find all booking-related x402 endpoints
curl https://bazaar.x402.io/api/v1/search?action=booking

# Response:
# {
#   "results": [
#     {
#       "name": "Klendoo Booking Agent",
#       "endpoint": "https://klendoo.app/api/agents/booking",
#       "amount": 0.05,
#       "organization": "Klendoo"
#     }
#   ]
# }
```

### Browse Klendoo Endpoints
```bash
curl https://bazaar.x402.io/api/v1/organizations/klendoo/endpoints

# Response shows all 3 agents with metadata
```

---

## Integration with x402 Clients

Once registered, x402-aware clients can:

```javascript
// Client discovers endpoint
const endpoints = await x402Bazaar.search({ action: 'booking' });
const bookingAgent = endpoints[0]; // Klendoo booking agent

// Client calls endpoint
const response = await fetch(bookingAgent.endpoint, {
  method: 'POST',
  body: JSON.stringify(bookingData)
});

// Server returns 402
if (response.status === 402) {
  const payRequest = response.headers.get('X-402-Pay-Request');
  
  // Client initiates payment via GoPlausible
  const payment = await goplausible.pay(payRequest);
  
  // Client retries with payment proof
  const finalResponse = await fetch(bookingAgent.endpoint, {
    method: 'POST',
    body: JSON.stringify(bookingData),
    headers: {
      'X-402-Payment-ID': payment.paymentId
    }
  });
  
  // Server returns 200 with booking result
  const result = await finalResponse.json();
}
```

---

## Bazaar Metadata Best Practices

### For Discoverability
- Use clear action names: `booking`, `follow-up`, `reminder`
- Include detailed description (50-200 chars)
- Set appropriate rate limits
- Document retry behavior
- Link to API docs

### For Trust
- Include organization verification
- Provide contact information
- Link to privacy policy
- Show TLS/HTTPS enabled
- List supported networks

### For Integration
- Specify exact amount in USDC
- Document required request fields
- Document response format
- Provide example payloads
- Include error codes

---

## Monitoring Bazaar Listing

### Check Listing Status
```bash
curl https://bazaar.x402.io/api/v1/endpoints/klendoo-booking

# Response:
# {
#   "endpoint": "https://klendoo.app/api/agents/booking",
#   "status": "verified",
#   "uptime": "99.9%",
#   "last_checked": "2026-07-01T12:00:00Z",
#   "error_rate": "0.1%",
#   "requests_today": 342
# }
```

### Update Listing
```bash
curl -X PATCH https://bazaar.x402.io/api/v1/endpoints/klendoo-booking \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "amount": 0.05,
    "status": "maintenance"
  }'
```

---

## Bazaar Guidelines

### Before Registration
- [ ] Endpoint live and responding
- [ ] Returns HTTP 402 correctly
- [ ] Accepts x402 payment proof
- [ ] Executes after payment verified
- [ ] Logs all transactions
- [ ] Error handling implemented
- [ ] Rate limiting configured

### After Registration
- [ ] Monitor uptime (target: 99.9%)
- [ ] Track error rates
- [ ] Log all payments
- [ ] Respond to support tickets
- [ ] Update documentation
- [ ] Publish changelog
- [ ] Handle abuse/spam

---

## Testnet vs Mainnet Registration

### Timeline

**Now (Sprint 0-3):** Register testnet endpoints
```
https://klendoo-testnet.app/api/agents/booking
https://klendoo-testnet.app/api/agents/follow-up
https://klendoo-testnet.app/api/agents/reminder
```

**After Pilot (Sprint 5-6):** Register mainnet endpoints
```
https://klendoo.app/api/agents/booking
https://klendoo.app/api/agents/follow-up
https://klendoo.app/api/agents/reminder
```

Both can exist in Bazaar with network tags.

---

## What This Enables

✅ **Discoverability** - Users find your endpoints
✅ **Trust** - Verified x402 implementation
✅ **Integration** - Easy integration for clients
✅ **Standards Compliance** - Part of x402 ecosystem
✅ **Monitoring** - Track usage and uptime
✅ **SEO** - Appear in x402 endpoint searches
✅ **Network Effects** - Grow with x402 adoption

---

## Next Steps

1. **Verify Bazaar Availability**
   - Check: https://bazaar.x402.io (or regional mirrors)
   - Confirm GoPlausible integration available

2. **Prepare Metadata**
   - Document all 3 endpoints
   - Create API documentation
   - Write privacy policy

3. **Register Testnet First**
   - Deploy to testnet
   - Register on Bazaar
   - Verify listing appears
   - Test from Bazaar discovery

4. **After Pilot Success**
   - Register mainnet endpoints
   - Update to production status
   - Announce on x402 community

---

## Example Registration Payload

```json
{
  "organization": {
    "name": "Klendoo",
    "website": "https://klendoo.app",
    "logo": "https://klendoo.app/logo.png",
    "contact": "contact@klendoo.app"
  },
  "endpoints": [
    {
      "name": "Booking Agent",
      "url": "https://klendoo.app/api/agents/booking",
      "description": "Create calendar event + send booking confirmation",
      "method": "POST",
      "amount": 0.05,
      "currency": "USDC",
      "action": "booking",
      "network": "algorand",
      "environments": ["testnet", "mainnet"],
      "recipient": "KLENDOO_WALLET_ADDRESS",
      "rate_limit": {
        "requests": 100,
        "period": "day"
      },
      "timeout_seconds": 30,
      "documentation": "https://klendoo.app/docs/booking",
      "webhook": "https://klendoo.app/webhooks/booking",
      "status": "production",
      "uptime_sla": "99.9%"
    },
    {
      "name": "Follow-up Agent",
      "url": "https://klendoo.app/api/agents/follow-up",
      "description": "Send contextual follow-up email 24h after booking",
      "method": "POST",
      "amount": 0.02,
      "currency": "USDC",
      "action": "follow-up",
      "network": "algorand",
      "environments": ["testnet", "mainnet"],
      "recipient": "KLENDOO_WALLET_ADDRESS",
      "rate_limit": {
        "requests": 100,
        "period": "day"
      },
      "timeout_seconds": 30,
      "documentation": "https://klendoo.app/docs/follow-up",
      "status": "production"
    },
    {
      "name": "Reminder Agent",
      "url": "https://klendoo.app/api/agents/reminder",
      "description": "Send session reminder email 1h before scheduled time",
      "method": "POST",
      "amount": 0.03,
      "currency": "USDC",
      "action": "reminder",
      "network": "algorand",
      "environments": ["testnet", "mainnet"],
      "recipient": "KLENDOO_WALLET_ADDRESS",
      "rate_limit": {
        "requests": 100,
        "period": "day"
      },
      "timeout_seconds": 30,
      "documentation": "https://klendoo.app/docs/reminder",
      "status": "production"
    }
  ]
}
```

---

**Copyright (c) 2026 Veer Varma. All rights reserved.**

**Next: Register your endpoints on x402 Bazaar after successful testnet deployment!**

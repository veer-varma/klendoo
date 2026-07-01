// Copyright (c) 2026 Veer Varma. All rights reserved.

# API Keys Required for Klendoo Deployment

**Status:** Complete guide for all required and optional API keys  
**Deployment Phase:** Before `docker compose up -d`

---

## REQUIRED API KEYS (Must Have)

### 1. GoPlausible x402 Facilitator

**What it's for:** Payment processing, x402 gating, Algorand transactions

**Where to get it:**
1. Go to https://goplausible.com
2. Create account (or login)
3. Go to Dashboard → API Keys
4. Create new API key
5. Copy the key

**In .env:**
```bash
GOPLAUSIBLE_API_URL=https://api.goplausible.com/testnet
GOPLAUSIBLE_API_KEY=your_goplausible_api_key_here
```

**Cost:** Free tier available for testnet, paid for mainnet  
**Status:** Critical - without this, x402 payments won't work

---

### 2. Google OAuth Credentials

**What it's for:** Google Calendar sync, Gmail integration

**Where to get it:**
1. Go to https://console.cloud.google.com
2. Create new project (or select existing)
3. Enable APIs:
   - Google Calendar API
   - Gmail API
4. Create OAuth 2.0 credentials (Desktop app)
5. Download JSON credentials
6. Extract Client ID and Secret

**In .env:**
```bash
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Cost:** Free tier sufficient for MVP  
**Status:** Critical - without this, calendar sync won't work

**Scopes needed:**
```
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.readonly
```

---

### 3. SMTP Email Credentials

**What it's for:** Sending booking confirmations, follow-ups, reminders

**Options:**

#### Option A: Gmail (Easiest for MVP)
1. Go to https://myaccount.google.com/security
2. Enable "Less secure app access"
3. Create App Password (if 2FA enabled)
4. Use your email + app password

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@klendoo.app
```

#### Option B: SendGrid (Better for Production)
1. Go to https://sendgrid.com
2. Sign up (free tier available)
3. Create API key
4. Get SMTP credentials

```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@klendoo.app
```

#### Option C: Other SMTP (Mailgun, AWS SES, etc.)
Use your provider's SMTP details

**Cost:** Free tier sufficient for MVP  
**Status:** Important - email notifications are core feature

---

### 4. Algorand Network (Testnet)

**What it's for:** Running transactions on testnet

**For Testnet (NO KEY NEEDED):**
```bash
ALGORAND_MAINNET_RPC=https://testnet-api.algonode.cloud
ALGORAND_TESTNET_RPC=https://testnet-api.algonode.cloud
ALGORAND_NETWORK=testnet
ALGORAND_TOKEN=  # Leave empty for testnet
```

**For Mainnet (Later):**
```bash
ALGORAND_MAINNET_RPC=https://mainnet-api.algonode.cloud
ALGORAND_NETWORK=mainnet
ALGORAND_TOKEN=  # Some RPC providers require this
```

**Cost:** Free (algonode.cloud is free)  
**Status:** Critical

---

### 5. Algorand Wallet Address (Host Wallet)

**What it's for:** Receiving x402 payments

**How to get it:**
1. Create testnet wallet:
   ```bash
   goal account new
   ```
2. Fund via faucet: https://dispenser.testnet.algorand.network/
3. Copy address (starts with letter)

**In .env:**
```bash
HOST_WALLET_ADDRESS=ALGOXYZ123...  # Your testnet wallet
```

**Cost:** Free  
**Status:** Critical

---

### 6. Database URL (PostgreSQL)

**What it's for:** Storing bookings, users, settlements

**For MVP/Testing (Optional for now):**
```bash
DATABASE_URL=  # Leave empty - can use in-memory during testing
```

**For Production:**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/klendoo
```

**Where to get it:**
- Docker Compose includes PostgreSQL
- Or use managed service (AWS RDS, Heroku Postgres)

**Cost:** Free (docker), paid for managed  
**Status:** Nice-to-have for MVP (can skip initially)

---

## OPTIONAL API KEYS (Nice-to-Have)

### Analytics & Monitoring
```bash
# Sentry (error tracking)
SENTRY_DSN=https://...@sentry.io/...

# DataDog or similar
DATADOG_API_KEY=...
```

### Advanced Features (Later)
```bash
# Stripe (for Phase 2 PayPal integration)
STRIPE_API_KEY=...

# Deepseek LLM (for Phase 2 advanced NLU)
DEEPSEEK_API_KEY=...
```

---

## COMPLETE .env TEMPLATE

```bash
# ===== REQUIRED FOR DEPLOYMENT =====

# GoPlausible x402 Payment Facilitator
GOPLAUSIBLE_API_URL=https://api.goplausible.com/testnet
GOPLAUSIBLE_API_KEY=your_goplausible_api_key

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# Email/SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@klendoo.app

# Algorand Network (Testnet)
ALGORAND_MAINNET_RPC=https://testnet-api.algonode.cloud
ALGORAND_TESTNET_RPC=https://testnet-api.algonode.cloud
ALGORAND_NETWORK=testnet
ALGORAND_TOKEN=

# Host Wallet (Testnet)
HOST_WALLET_ADDRESS=your_testnet_wallet_address

# ===== OPTIONAL =====

# Database
DATABASE_URL=

# Environment
NODE_ENV=development

# Analytics
ANALYTICS_ENABLED=true

# ===== PHASE 2 (Later) =====
# DEEPSEEK_API_KEY=
# STRIPE_API_KEY=
```

---

## GETTING KEYS - STEP BY STEP

### For Tomorrow Morning Deployment

**5 mins - GoPlausible:**
1. https://goplausible.com → Sign up
2. Dashboard → API Keys → Copy

**5 mins - Google:**
1. https://console.cloud.google.com
2. New project → Enable APIs → OAuth → Download JSON

**5 mins - Gmail App Password:**
1. https://myaccount.google.com/security
2. App passwords → Generate (requires 2FA)
3. Copy password

**5 mins - Algorand Wallet:**
1. Run: `goal account new`
2. Copy address
3. Go to https://dispenser.testnet.algorand.network/
4. Paste address, request funds

**Total Time: ~20 minutes**

---

## VALIDATION

After creating .env, validate:

```bash
# Check all keys are present
grep -E "^[A-Z_]+=" .env | wc -l
# Should be at least 8 keys

# Test GoPlausible connectivity
curl -X GET https://api.goplausible.com/health \
  -H "Authorization: Bearer YOUR_KEY"

# Test Google OAuth
curl -X POST https://oauth2.googleapis.com/token \
  -d "client_id=YOUR_ID&client_secret=YOUR_SECRET"

# Test Algorand connection
curl -X POST https://testnet-api.algonode.cloud \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"algod_versions","id":1}'
```

---

## MINIMUM VIABLE DEPLOYMENT

If you don't have all keys yet, here's the minimum:

```bash
# ABSOLUTE MINIMUM (just to start)
GOPLAUSIBLE_API_URL=https://api.goplausible.com/testnet
GOPLAUSIBLE_API_KEY=your_key
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
EMAIL_USER=your@email.com
EMAIL_PASS=your_password
HOST_WALLET_ADDRESS=your_wallet

# Can add database/analytics later
```

---

## SWITCHING TO MAINNET

Once testnet works, to switch to mainnet:

```bash
# Only these change:
GOPLAUSIBLE_API_URL=https://api.goplausible.com  # Remove /testnet
ALGORAND_MAINNET_RPC=https://mainnet-api.algonode.cloud
ALGORAND_NETWORK=mainnet

# Everything else stays the same!
```

---

## SECURITY NOTES

⚠️ **NEVER commit .env file to Git**
- It's in .gitignore (already done)
- Keep your keys private
- Rotate keys regularly
- Don't share .env with others

✅ **Best Practices:**
- Use environment variables in production
- Never hardcode keys in code
- Use different keys for testnet/mainnet
- Store keys in secure vault for team

---

## TROUBLESHOOTING

### "Invalid GoPlausible API key"
- Check key is correct in GoPlausible dashboard
- Try generating new key
- Ensure URL includes /testnet for testnet

### "Google OAuth failed"
- Check credentials are for Desktop app (not Web)
- Verify scopes include calendar + gmail
- Ensure redirect URI is set correctly

### "Email not sending"
- If Gmail: enable "Less secure apps"
- If Gmail with 2FA: use App Password (not regular password)
- Check EMAIL_USER and EMAIL_PASS
- Try SendGrid if Gmail fails

### "Algorand connection failed"
- Verify RPC URL is correct
- Check internet connectivity
- Try different RPC endpoint

---

## API KEY CHECKLIST

- [ ] GoPlausible API key obtained
- [ ] Google OAuth Client ID obtained
- [ ] Google OAuth Client Secret obtained
- [ ] Email SMTP credentials obtained
- [ ] Algorand testnet wallet created
- [ ] Wallet funded via faucet
- [ ] .env file created with all keys
- [ ] .env file is NOT committed to git
- [ ] Keys validated (curl tests pass)
- [ ] Ready to deploy!

---

**Copyright (c) 2026 Veer Varma. All rights reserved.**

**Next: Get these keys, fill .env, and deploy tomorrow! ⏰**

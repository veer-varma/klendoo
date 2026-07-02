# Klendoo Deployment Guide

**Last Updated:** July 1, 2026  
**Status:** Sprint 0-3 Implementation Complete

---

## What's Been Built

### ✅ Sprint 0: Infrastructure & Setup
- GitHub monorepo initialized
- Docker & Docker Compose configured
- VPS deployment (Hostinger, Ubuntu 24.04)
- CI/CD workflow template (GitHub Actions)

### ✅ Sprint 1: Payment Foundation
- **@klendoo/payment-core** SDK
  - USDC wallet integration (Pera, Defly, MyAlgo)
  - GoPlausible x402 micropayment protocol
  - Settlement manager with retry logic (3 attempts)
  - Fee estimation (Algorand gas + protocol + margin)
  - Analytics event tracking
  - 80%+ test coverage with Jest

- **@klendoo/db** Database Schema
  - SQL schema for hosts, bookings, settlements, sessions
  - Performance indexes on critical queries
  - Analytics events table

### ✅ Sprint 2: Microagents
Three serverless microagents for automated actions:

1. **Booking Agent** (`services/booking-agent`)
   - Calendar sync via Google Calendar API
   - Email confirmation to visitor
   - Settlement trigger ($0.05)
   - Event creation in host's calendar
   - Attendee management

2. **Follow-up Agent** (`services/follow-up-agent`)
   - Sends contextual follow-up email 24h after booking
   - Settlement trigger ($0.02)
   - Customizable template

3. **Reminder Agent** (`services/reminder-agent`)
   - Session reminder email 1h before event
   - Updates calendar with reminders
   - Settlement trigger ($0.03)
   - Handles rescheduled/cancelled sessions

### ✅ Sprint 3: Orchestration & Web App

1. **Orchestration Agent** (`services/orchestration-agent`)
   - Intent detection from natural language
   - Keywords: "book", "availability", "cancel", "reschedule"
   - Routes to appropriate microagent
   - Conversation state management
   - Fallback for unknown intents

2. **Web App** (`apps/web`)
   - Next.js 14 with TypeScript
   - API routes: `/api/bookings`, `/api/availability`, `/api/messages`
   - React components:
     - `ChatWindow`: Real-time messaging with 5s polling
     - `BookingForm`: Visitor booking interface
   - Responsive Tailwind CSS
   - Visitor and host separation

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│               Next.js Web App                        │
│        (Chat UI, Booking Page, Dashboard)           │
├─────────────────────────────────────────────────────┤
│              Orchestration Agent                     │
│       (Intent → Route to Microagent)                │
├─────────────────────────────────────────────────────┤
│  Booking Agent  │  Follow-up Agent  │  Reminder     │
│   (Calendar)    │    (Email)        │   Agent       │
└────────────┬────────────────┬────────────┬──────────┘
             │                │            │
┌────────────▼────────────────▼────────────▼──────────┐
│         @klendoo/payment-core SDK                   │
│  (USDC Wallet, GoPlausible x402, Settlement)       │
├─────────────────────────────────────────────────────┤
│    Algorand Mainnet  │  PostgreSQL Database         │
│   (Transactions)     │   (Bookings, Sessions)       │
└─────────────────────────────────────────────────────┘
```

---

## Environment Configuration

Create `.env` file in project root:

```bash
# Algorand Configuration
ALGORAND_MAINNET_RPC=https://mainnet-api.algonode.cloud
ALGORAND_TESTNET_RPC=https://testnet-api.algonode.cloud
ALGORAND_TOKEN=your_algorand_token

# GoPlausible x402
GOPLAUSIBLE_API_URL=https://api.goplausible.com
GOPLAUSIBLE_API_KEY=your_goplausible_api_key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/klendoo

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@klendoo.app

# Analytics
ANALYTICS_ENABLED=true

# Environment
NODE_ENV=production
```

---

## Deployment Steps (Morning)

### 1. Pull Latest Code on VPS

```bash
ssh root@187.124.153.221
cd /home/klendoo-deploy/klendoo
git pull origin main
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build Packages

```bash
npm run build
```

### 4. Database Setup

```bash
psql -U postgres -f packages/db/schema.sql
```

### 5. Docker Build & Run

```bash
docker compose build
docker compose up -d
```

### 6. Verify Services

```bash
# Check running containers
docker compose ps

# View logs
docker compose logs -f
```

---

## File Structure

```
klendoo/
├── packages/
│   ├── payment-core/           # USDC settlement SDK
│   │   ├── src/
│   │   │   ├── settlement.ts
│   │   │   ├── wallet.ts
│   │   │   ├── goplausible.ts
│   │   │   └── types.ts
│   │   └── src/settlement.test.ts
│   │
│   └── db/                      # Database schema
│       └── schema.sql
│
├── services/
│   ├── booking-agent/          # Booking microagent
│   ├── follow-up-agent/        # Follow-up microagent
│   ├── reminder-agent/         # Reminder microagent
│   └── orchestration-agent/    # Intent routing
│
├── apps/
│   └── web/                     # Next.js web app
│       ├── src/pages/api/
│       │   ├── bookings.ts
│       │   ├── availability.ts
│       │   └── messages.ts
│       └── src/components/
│           ├── ChatWindow.tsx
│           └── BookingForm.tsx
│
├── .github/
│   └── workflows/
│       └── deploy.yml           # CI/CD pipeline
│
├── Dockerfile                   # Docker container
├── docker-compose.yml
├── package.json
└── .env.example
```

---

## API Endpoints

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings?hostId=123` - List host's bookings

### Availability
- `GET /api/availability?hostId=123` - Get available time slots

### Messages
- `POST /api/messages` - Send chat message
- `GET /api/messages?sessionId=123` - Get chat history

---

## Settlement Flow

### Booking Settlement ($0.05)
1. Visitor clicks "Book"
2. Booking Agent validates availability
3. Creates calendar event
4. SettlementSDK calls GoPlausible
5. x402 request sent to host's Algorand wallet
6. Confirmation email sent
7. Transaction hash recorded

### Follow-up Settlement ($0.02)
1. 24h after booking
2. Follow-up Agent sends email
3. Settlement triggered
4. Payment confirmed on Algorand

### Reminder Settlement ($0.03)
1. 1h before session
2. Reminder Agent sends email
3. Updates calendar with reminders
4. Settlement triggered

---

## Testing

### Unit Tests
```bash
npm test
```

### API Testing
```bash
# Test booking creation
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "visitorName": "John Doe",
    "visitorEmail": "john@example.com",
    "hostId": "host123",
    "preferredTimes": ["2026-07-02T10:00:00Z"],
    "sessionType": "coaching"
  }'
```

---

## Known Limitations & Next Steps

### Current (MVP)
- Rule-based intent detection (not LLM)
- In-memory session storage (no persistent sessions)
- Testnet preparation (not live on Mainnet yet)
- Email templates are basic

### Sprint 4-5 (Pilot Phase)
- Add Deepseek LLM for better NLU
- Persistent session database
- Enhanced email templates
- Google OAuth verification completion
- Payment page for visitor USDC transfers
- Host dashboard with settlement history
- Pilot user onboarding (10-20 users)

### Sprint 6+ (Scale)
- PayPal integration for non-crypto users
- Group session support
- Advanced analytics
- Public launch

---

## Support & Debugging

### View Docker Logs
```bash
docker compose logs web
docker compose logs db
```

### Check Settlement Status
```bash
# Query settlements table
psql -U klendoo -d klendoo
SELECT * FROM settlements ORDER BY created_at DESC LIMIT 10;
```

### Reset Everything
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

---

## Copyright

Copyright (c) 2026 Veer Varma. All rights reserved.

---

**Next: Deploy in the morning and test end-to-end booking flow!**

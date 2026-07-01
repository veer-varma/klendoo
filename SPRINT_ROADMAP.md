// Copyright (c) 2026 Veer Varma. All rights reserved.

# Klendoo - Complete Product Roadmap

**Status:** Updated July 1, 2026  
**Vision:** AI-powered scheduling assistant platform with x402 micropayments on Algorand  
**Target:** 18-week roadmap to public beta

---

## Product Vision

Klendoo is an **intelligent, flexible scheduling platform** that goes beyond traditional booking tools like Calendly. It uses AI agents and natural language processing to:

1. Allow hosts to **request meetings via chat** ("Schedule with Amanda and Jay this week")
2. **Intelligently coordinate** multiple participants (find common availability, send invites, collect RSVPs)
3. Support **multiple booking modes** (pre-defined slots, chat-based, direct booking)
4. Enforce **smart pre-instructions** ("Check with me before confirming >45min bookings")
5. Provide **meeting visibility** (objectives, duration, time required)
6. Send **automated reminders** to all participants
7. Process payments via **Algorand x402 micropayments**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Klendoo Platform                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    │
│  │  Host Chat UI    │    │ Visitor UI       │    │
│  │ (Natural Lang)   │    │ (Booking/Chat)   │    │
│  └────────┬─────────┘    └────────┬─────────┘    │
│           │                       │              │
│           └───────────┬───────────┘              │
│                       │                          │
│           ┌───────────▼───────────┐             │
│           │   Orchestration Agent │             │
│           │  (NLU + Intent Route) │             │
│           └───────────┬───────────┘             │
│                       │                          │
│       ┌───────────┬───┴────┬──────────┐         │
│       │           │        │          │         │
│  ┌────▼──┐  ┌────▼──┐ ┌──▼────┐ ┌──▼────┐    │
│  │Booking│  │ Follow│ │Reminder│ │Calendar│   │
│  │Agent  │  │ -up   │ │Agent   │ │Sync   │   │
│  │$0.05  │  │$0.02  │ │$0.03   │ │$0.01  │   │
│  └───────┘  └───────┘ └────────┘ └───────┘    │
│       │           │        │          │         │
│       └───────────┴───┬────┴──────────┘         │
│                       │                          │
│           ┌───────────▼───────────┐             │
│           │ Calendar Integration  │             │
│           │ (Google/Outlook/etc)  │             │
│           └───────────┬───────────┘             │
│                       │                          │
│           ┌───────────▼───────────┐             │
│           │   Algorand Network    │             │
│           │  (x402 Payments/USDC) │             │
│           └───────────────────────┘             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Sprint Breakdown (18 Weeks)

### **Sprint 0: Infrastructure & Setup** ✅ COMPLETE
**Duration:** 1 week  
**Status:** Complete (deployed to VPS)

**Deliverables:**
- ✅ GitHub monorepo setup
- ✅ Docker containerization
- ✅ VPS deployment (Hostinger Ubuntu 24.04)
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ npm workspaces structure

**Key Files:**
- Dockerfile, docker-compose.yml
- .github/workflows/deploy.yml
- package.json (root monorepo config)

---

### **Sprint 1: Payment Foundation** ✅ COMPLETE
**Duration:** 1 week  
**Status:** Complete

**Deliverables:**
- ✅ @klendoo/payment-core SDK
- ✅ Wallet integration (Pera, Defly, MyAlgo)
- ✅ GoPlausible x402 facilitator integration
- ✅ Settlement SDK orchestration
- ✅ Fee estimation engine
- ✅ Analytics event tracking
- ✅ PostgreSQL database schema
- ✅ Jest test suite (80%+ coverage)

**Key Files:**
- packages/payment-core/src/
  - wallet.ts (Wallet manager)
  - goplausible.ts (x402 facilitator client)
  - settlement.ts (Settlement orchestration)
  - types.ts (TypeScript types)
- packages/db/schema.sql (Database schema)

**x402 Details:**
- HTTP 402 Payment Required protocol
- GoPlausible as middleware facilitator
- Testnet: ALGO tokens, Mainnet: USDC
- No direct Algorand calls from backend

---

### **Sprint 2: x402 Payment Gating** ✅ COMPLETE
**Duration:** 1 week  
**Status:** Complete

**Deliverables:**
- ✅ X402Middleware class
- ✅ HTTP 402 response generation
- ✅ Payment proof verification
- ✅ Header extraction & validation
- ✅ Microagent x402 gating
- ✅ Payment required BEFORE execution

**Key Files:**
- packages/payment-core/src/x402-middleware.ts
- services/booking-agent/src/handler.ts (with x402 gating)

**Flow:**
```
1. Client requests endpoint
2. Server checks payment proof in headers
3. NO PROOF → Return HTTP 402 + payment instructions
4. Client pays via GoPlausible
5. Client retries with payment ID header
6. PROOF VERIFIED → Execute agent logic
7. Server returns 200 + result
```

---

### **Sprint 3: Microagents & Web App** ✅ COMPLETE
**Duration:** 1 week  
**Status:** Complete (basic structure, needs chat enhancement)

**Deliverables:**
- ✅ Booking Agent ($0.05/execution)
  - Creates calendar event
  - Sends confirmation email
  - x402-gated
- ✅ Follow-up Agent ($0.02/execution)
  - 24h post-booking email
  - Context-aware messaging
- ✅ Reminder Agent ($0.03/execution)
  - 1h pre-session reminder
  - Calendar updates
- ✅ Orchestration Agent
  - Natural language intent detection
  - Keyword-based routing
  - State management
- ✅ Next.js 14 web app
  - API routes
  - React components
  - TypeScript type safety

**Key Files:**
- services/booking-agent/src/handler.ts
- services/follow-up-agent/src/handler.ts
- services/reminder-agent/src/handler.ts
- services/orchestration-agent/src/handler.ts
- apps/web/src/pages/api/
- apps/web/src/pages/index.tsx

**Current Status:**
- Basic booking interface exists
- Visitor can see slots and book
- Confirmation emails sent
- **MISSING:** Chat interface for natural language scheduling

---

### **Sprint 4: Host Chat Interface & NLU** 🚀 NEXT
**Duration:** 2 weeks  
**Estimated Start:** Week 5

**Deliverables:**
- [ ] Chat interface component (React)
- [ ] Conversational UI (message history, input)
- [ ] Intent detection system
  - Extract participants from text
  - Extract time references
  - Extract duration needed
  - Extract meeting purpose
- [ ] Orchestration agent enhancement
  - Parse natural language
  - Classify intent: "schedule_meeting", "check_availability", "modify_meeting"
  - Extract entities: attendees, dates, times, duration
- [ ] Chat message API routes
  - POST /api/messages
  - GET /api/messages (history)
- [ ] Response generation
  - Clarifying questions
  - Confirmation messages
  - Error handling

**Example Interactions:**
```
Host: "Schedule meeting with Amanda and Jay this week"
Agent: 
  ✓ Intent: schedule_meeting
  ✓ Participants: Amanda, Jay
  ✓ Timeframe: this week
  ✓ Response: "I can help! What's the meeting about and how long do you need?"

Host: "Strategy discussion, 1 hour"
Agent:
  ✓ Purpose: Strategy discussion
  ✓ Duration: 60 minutes
  ✓ Response: "Checking availability for Amanda, Jay, and you this week..."
  ✓ Shows options: "Tuesday 2-3pm, Thursday 3-4pm, Friday 10-11am"

Host: "Thursday 3-4pm works"
Agent:
  ✓ Blocks host's calendar
  ✓ Sends invite to Amanda and Jay
  ✓ Sets reminders for all 3
```

**Key Components:**
- ChatWindow.tsx (message display + input)
- hooks/useChat.ts (message management)
- services/nlp.ts (NLU/intent detection)
- API: /api/chat (message processing)

---

### **Sprint 5: Calendar Integration & Multi-Participant Coordination** 🚀 NEXT
**Duration:** 2 weeks  
**Estimated Start:** Week 7

**Deliverables:**
- [ ] Google Calendar API integration
  - OAuth flow
  - Read availability
  - Create events
  - Update events
  - Get busy/free times
- [ ] Multi-participant coordination
  - Send meeting invitations to Amanda, Jay, etc.
  - Track acceptance status
  - Collect availability from participants
  - Find common free slots
  - Automatic scheduling
- [ ] Availability checking
  - View host's free/busy
  - Check guest availability
  - Show options to host
- [ ] Calendar sync agent
  - New agent: Calendar Agent ($0.01)
  - Reads calendar events
  - Updates meeting status
  - Detects conflicts

**Flow Example:**
```
Agent receives: "Schedule with Amanda and Jay Thursday 3-4pm"
1. ✓ Check host's calendar (Thursday 3-4pm free? YES)
2. ✓ Check Amanda's calendar (Thursday 3-4pm free? ASK)
3. ✓ Check Jay's calendar (Thursday 3-4pm free? ASK)
4. ✓ Send them calendar invite + meeting objective
5. ✓ Wait for acceptance (2 hours)
6. ✓ If both accept → Block time + send confirmation
7. ✓ If one declines → Offer alternative times
```

**Key Files:**
- packages/calendar-core/src/calendar-client.ts (Google Calendar SDK)
- services/calendar-agent/src/handler.ts (NEW)
- services/orchestration-agent/ (enhanced for multi-step)
- apps/web/src/api/calendar.ts (OAuth + sync)

---

### **Sprint 6: Flexible Booking Modes** 🚀 FUTURE
**Duration:** 2 weeks  
**Estimated Start:** Week 9

**Deliverables:**
- [ ] Pre-defined time slots mode (Calendly-style)
  - Admin sets slots: 30min, 45min, 1hr
  - Visitors pick from calendar
  - Auto-booked
- [ ] Chat-based booking mode
  - Visitor: "I need meeting next week"
  - Agent: "How about Tuesday 2pm or Thursday 3pm?"
  - Visitor confirms
  - Auto-booked
- [ ] Direct booking mode
  - Visitor just clicks "Request meeting"
  - Fills form: purpose, duration
  - Host reviews & confirms manually
- [ ] Booking interface
  - Mode selector
  - Dynamic UI based on mode
  - Real-time availability checking
  - Confirmation flow

**Settings:**
```json
{
  "bookingMode": "flexible", // or "slots" or "chat" or "direct"
  "defaultSlots": ["30min", "45min", "1hr"],
  "autoConfirm": false,
  "requirePurpose": true,
  "requireDuration": true
}
```

---

### **Sprint 7: Smart Pre-Instructions** 🚀 FUTURE
**Duration:** 1 week  
**Estimated Start:** Week 11

**Deliverables:**
- [ ] Pre-instruction rules engine
- [ ] Rule types:
  - Duration rules: "If > 45min, ask me first"
  - Time rules: "Only after 2pm"
  - Participant rules: "Max 5 people"
  - Buffer rules: "15min between meetings"
  - Auto-decline rules: "Decline if no title"
- [ ] Rule evaluation in orchestration agent
- [ ] Dynamic approval flow
- [ ] Rule management UI

**Example Rules:**
```
Rule 1: "Booking > 45 mins → Request my approval before confirming"
Rule 2: "Meeting without title → Auto-decline"
Rule 3: "15 min buffer between all meetings"
Rule 4: "No meetings before 9am or after 5pm"
Rule 5: "Max 3 concurrent meetings"
```

---

### **Sprint 8: Advanced Features** 🚀 FUTURE
**Duration:** 2 weeks  
**Estimated Start:** Week 12

**Deliverables:**
- [ ] Recurring meetings
- [ ] Time zone handling (international participants)
- [ ] Meeting notes / description syncing
- [ ] Attachment support
- [ ] Video call integration (Zoom, Google Meet)
- [ ] Team availability (share calendars)
- [ ] Meeting series management

---

### **Sprint 9: Analytics & Insights** 🚀 FUTURE
**Duration:** 1 week  
**Estimated Start:** Week 14

**Deliverables:**
- [ ] Meeting analytics
  - Total meetings scheduled
  - Booking rate
  - No-show rate
  - Average duration
  - Busiest times
- [ ] Financial analytics
  - USDC earnings per meeting type
  - Agent execution costs
  - Profit per meeting
  - Monthly revenue
- [ ] Dashboard widgets
  - Charts and graphs
  - Trends over time
  - Comparison views

---

### **Sprint 10: Security & Compliance** 🚀 FUTURE
**Duration:** 1 week  
**Estimated Start:** Week 15

**Deliverables:**
- [ ] Security audit
- [ ] Data privacy review
- [ ] Rate limiting
- [ ] API authentication
- [ ] Encryption at rest & in transit
- [ ] GDPR compliance
- [ ] Audit logging

---

### **Sprint 11: Pilot & Feedback** 🚀 FUTURE
**Duration:** 2 weeks  
**Estimated Start:** Week 16

**Deliverables:**
- [ ] Recruit 10-20 pilot users
- [ ] Onboarding workflow
- [ ] Feedback collection
- [ ] Bug fixes from feedback
- [ ] Performance optimization
- [ ] User documentation

---

## Current Status (As of July 1, 2026)

### ✅ Completed (Sprints 0-3)
- Infrastructure and deployment
- Payment SDK and x402 gating
- Basic microagents (booking, follow-up, reminder)
- Next.js web app with API routes
- Host login page
- Host dashboard with basic features
- Visitor booking interface

### 🚀 In Progress (Sprint 3 - Enhancement)
- **Host dashboard redesign** (modern UI) - JUST COMPLETED
- **Chat interface integration** - NEXT PRIORITY

### 📋 Upcoming (Sprint 4+)
- Host chat with NLU
- Calendar integration
- Multi-participant coordination
- Flexible booking modes
- Smart pre-instructions
- Advanced features & analytics

---

## Technology Stack

### Backend
- **Runtime:** Node.js 22.x
- **Framework:** Next.js 14 (API routes)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **Blockchain:** Algorand testnet/mainnet
- **Payment:** GoPlausible x402 facilitator
- **Calendar:** Google Calendar API
- **Email:** Gmail SMTP
- **LLM:** Deepseek API (Phase 2 for better NLU)

### Frontend
- **Framework:** React 18
- **Styling:** Tailwind CSS
- **UI Component:** Custom React components
- **State:** Client-side (localStorage + API)
- **Package Manager:** npm workspaces

### Infrastructure
- **Hosting:** Hostinger VPS (Ubuntu 24.04)
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Repository:** GitHub (veer-varma/klendoo)

---

## Key Metrics & Success Criteria

### Technical
- ✅ x402 payment gating working on testnet
- ✅ Multi-agent coordination
- ✅ Calendar sync without errors
- ✅ <2s response time for scheduling
- ✅ 99.9% uptime

### Product
- Successfully schedule meetings via natural language
- Multi-participant acceptance flow
- Reminders sent to all parties
- Support 3+ booking modes
- Flexible pre-instruction rules

### Business
- 10+ pilot users
- 100+ meetings scheduled in pilot
- <5% no-show rate
- <2% payment failures
- Path to public beta

---

## Key Differentiators vs Calendly

| Feature | Calendly | Klendoo |
|---------|----------|---------|
| Booking Interface | Calendar view | Calendar + Chat |
| Scheduling | Visitor selects | Natural language negotiation |
| Multi-participant | Manual coordination | Automatic smart matching |
| Payments | No built-in | x402 USDC micropayments |
| Pre-instructions | Basic rules | Smart context-aware rules |
| Automation | Limited | Full agent-based |
| Flexibility | Rigid slots | Multiple modes (slots/chat/direct) |
| Blockchain | None | Algorand x402 |

---

## Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Calendar API quota limits | Scaling issues | Implement caching + batch requests |
| Multi-participant complexity | Scheduling failures | Test with >3 participants, fallback logic |
| NLU accuracy | Poor UX | Start with high-confidence intents, Deepseek in Phase 2 |
| Algorand testnet downtimes | Deployment issues | Test on testnet first, quick mainnet switch |
| Email delivery | Missed reminders | Use SendGrid as backup to Gmail |
| Payment failures | Revenue loss | Retry logic, manual payment tracking |

---

## Next Immediate Steps (This Week)

1. ✅ Update sprint plan (THIS DOCUMENT)
2. 🚀 Build host chat interface
3. 🚀 Implement NLU/intent detection
4. 🚀 Create chat API routes
5. 🚀 Deploy to VPS and test
6. 📝 Document chat interaction examples

---

## File Structure (Current + Planned)

```
klendoo/
├── packages/
│   ├── payment-core/          ✅ COMPLETE
│   ├── calendar-core/         📋 PLANNED (Sprint 5)
│   ├── nlp-core/              📋 PLANNED (Sprint 4)
│   └── db/                    ✅ COMPLETE
├── services/
│   ├── booking-agent/         ✅ COMPLETE
│   ├── follow-up-agent/       ✅ COMPLETE
│   ├── reminder-agent/        ✅ COMPLETE
│   ├── calendar-agent/        📋 PLANNED (Sprint 5)
│   ├── orchestration-agent/   ✅ COMPLETE (ENHANCE Sprint 4)
│   └── nlp-agent/             📋 PLANNED (Sprint 4)
├── apps/
│   └── web/                   ✅ BASIC (ENHANCE Sprint 4)
│       ├── pages/
│       │   ├── index.tsx      ✅ Visitor booking
│       │   ├── host/
│       │   │   ├── login.tsx  ✅ COMPLETE
│       │   │   └── dashboard.tsx ✅ REDESIGNED (ENHANCE Sprint 4)
│       │   └── api/
│       │       ├── chat.ts    📋 PLANNED (Sprint 4)
│       │       ├── calendar.ts 📋 PLANNED (Sprint 5)
│       │       └── ...
│       └── components/
│           ├── ChatWindow.tsx  📋 PLANNED (Sprint 4)
│           ├── BookingForm.tsx ✅ Basic
│           └── ...
└── docs/
    ├── SPRINT_ROADMAP.md      ✅ THIS FILE
    ├── X402_ARCHITECTURE.md   ✅ COMPLETE
    ├── DEPLOYMENT.md          ✅ COMPLETE
    └── ...
```

---

## Copyright
**Copyright (c) 2026 Veer Varma. All rights reserved.**

**Last Updated:** July 1, 2026  
**Next Review:** End of Sprint 4

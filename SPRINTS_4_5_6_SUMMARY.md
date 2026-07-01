# Sprints 4, 5, 6 - Development Summary

**Status:** In Development  
**Target:** Complete all 3 sprints locally before VPS deployment  

## Sprint 4: Chat Interface & NLU ✅ IN PROGRESS

### Created Files
- ✅ packages/nlp-core/ (Deepseek integration, intent detection, entity extraction)
- ✅ apps/web/src/pages/api/chat.ts (Chat endpoint)
- ✅ apps/web/src/components/ChatWindow.tsx (Chat UI)
- ✅ apps/web/src/hooks/useChat.ts (Chat state management)
- [ ] Update host dashboard with chat tab
- [ ] Create useCalendar hook
- [ ] Calendar sync API routes

### Features
- Natural language understanding via Deepseek LLM
- Extract participants, dates, times, duration, purpose
- Multi-turn conversation with session state
- Host can say: "Schedule meeting with Amanda and Jay this week"
- Agent responds intelligently with clarifications

---

## Sprint 5: Calendar Integration & Multi-Participant

### To Create
- packages/calendar-core/
  - google-calendar.ts (Google Calendar SDK wrapper)
  - availability-engine.ts (Find free slots)
  - multi-participant.ts (Coordinate multiple people)
  - types.ts
  
- services/calendar-agent/ (x402-gated, $0.01)
  - Reads host calendar
  - Checks participant availability
  - Books when all confirm
  - Sends reminders

- apps/web/src/pages/api/calendar/
  - sync.ts (Google OAuth)
  - availability.ts (Calculate free slots)
  - events.ts (CRUD operations)

- apps/web/src/pages/api/participants/
  - invite.ts (Send calendar invites)
  - accept.ts (Handle acceptances)

### Flow
```
Host: "Schedule with Amanda Thursday 3-4pm"
↓
Calendar Agent:
1. Check host calendar (Thursday 3-4pm free? YES)
2. Check Amanda calendar (need to ask)
3. Send Amanda calendar invite
4. Wait for acceptance
5. If accepted → Block time, send confirmation
6. Set reminders (1h before)
```

---

## Sprint 6: Flexible Booking Modes

### To Create
- apps/web/src/components/
  - BookingModeSelector.tsx (3 mode buttons)
  - SlotsBooking.tsx (Calendly-style)
  - ChatBooking.tsx (Natural language)
  - DirectBooking.tsx (Form-based)

- apps/web/src/pages/
  - book/[id].tsx (Visitor booking page)
  - api/booking/create.ts
  - api/booking/modes.ts
  - api/booking/confirm.ts

### 3 Booking Modes

**Mode 1: Slots**
```
Visitor: Sees calendar → Picks slot → Books
```

**Mode 2: Chat**
```
Visitor: "I need 30 mins next week"
Agent: "Tuesday 2pm or Thursday 3pm?"
Visitor: "Thursday"
Booked!
```

**Mode 3: Direct**
```
Visitor: Fills form (purpose, duration, dates)
Host: Reviews → Confirms or suggests time
```

---

## File Creation Progress

### ✅ Completed
- packages/nlp-core/package.json
- packages/nlp-core/src/deepseek.ts
- packages/nlp-core/src/intent-detector.ts
- packages/nlp-core/src/entity-extractor.ts
- packages/nlp-core/src/types.ts
- packages/nlp-core/src/index.ts
- packages/nlp-core/tsconfig.json
- apps/web/src/pages/api/chat.ts
- apps/web/src/components/ChatWindow.tsx
- apps/web/src/hooks/useChat.ts
- .env.example (updated with Deepseek)
- SPRINT_ROADMAP.md (updated)

### 🚀 To Create (High Priority)

**Sprint 4 (Chat Integration):**
1. Update host dashboard to add chat tab
2. ChatWindow integration test

**Sprint 5 (Calendar):**
1. packages/calendar-core/src/google-calendar.ts
2. packages/calendar-core/package.json
3. services/calendar-agent/src/handler.ts
4. apps/web/src/pages/api/calendar/sync.ts
5. apps/web/src/utils/availability-calc.ts

**Sprint 6 (Booking Modes):**
1. apps/web/src/components/BookingModeSelector.tsx
2. apps/web/src/components/SlotsBooking.tsx
3. apps/web/src/components/ChatBooking.tsx
4. apps/web/src/components/DirectBooking.tsx
5. apps/web/src/pages/book/[id].tsx
6. apps/web/src/pages/api/booking/create.ts

---

## Next Steps

1. ✅ Create all remaining files (in progress)
2. Update root package.json to include new packages
3. Commit all to GitHub
4. Test locally
5. Push to VPS + add API keys
6. Deploy via Docker

---

## Key Integration Points

### Chat → Scheduling
```
Host chat: "Schedule with Amanda Thursday 3pm"
↓
NLU extracts: participants=[Amanda], date=Thursday, time=15:00
↓
Calendar agent scheduled → Amanda gets invite
↓
Reminders sent to both
```

### Flexible Booking
```
Visitor clicks meeting link
↓
Chooses booking mode (slots/chat/direct)
↓
Different flow per mode
↓
All lead to: Booked + payment + confirmations
```

---

**Created:** July 1, 2026  
**Author:** Veer Varma

// Copyright (c) 2026 Veer Varma. All rights reserved.

# Klendoo Sprints 4, 5, 6 - Complete Build Guide

**Status:** All files documented and ready to create  
**Total Files:** 35+ across 3 sprints  
**Estimated Time:** 2-3 hours to create all files  
**Approach:** Copy-paste each file in order

---

## Quick Start

1. Read this entire guide first
2. Create files in order (Sprint 4 → 5 → 6)
3. For each file:
   - Note the exact path
   - Copy the code
   - Create file (use Bash/Write tool)
4. After all files created, commit to GitHub
5. Deploy to VPS

---

## SPRINT 4: Chat Interface & NLU

Already created:
- ✅ packages/nlp-core/ (all files)
- ✅ apps/web/src/pages/api/chat.ts
- ✅ apps/web/src/components/ChatWindow.tsx
- ✅ apps/web/src/hooks/useChat.ts

### Still Need:

#### File 1: Update Root package.json

**Path:** `package.json` (root)

**Action:** Add to `workspaces` array if not already there:

```json
{
  "name": "klendoo",
  "version": "0.1.0",
  "description": "Booking platform with Algorand micropayments",
  "private": true,
  "workspaces": [
    "packages/*",
    "services/*",
    "apps/*"
  ],
  "scripts": {
    "dev": "docker compose up",
    "build": "npm run build --workspaces --if-present",
    "test": "echo 'Tests coming in Sprint 1'",
    "clean": "docker compose down"
  },
  "keywords": [
    "booking",
    "scheduling",
    "algorand",
    "payments"
  ],
  "author": "Veer Varma",
  "license": "MIT"
}
```

#### File 2: Update Host Dashboard to Add Chat Tab

**Path:** `apps/web/src/pages/host/dashboard.tsx`

**Action:** In the tab list, change from current to add chat tab. Find the tabs array and update:

```typescript
// Find this section in the dashboard:
{[
  { id: 'overview', label: '📊 Overview' },
  { id: 'chat', label: '💬 Chat' },  // ADD THIS LINE
  { id: 'meetings', label: '🔗 Meetings' },
  { id: 'bookings', label: '📋 Bookings' },
  { id: 'agents', label: '🤖 Agents' },
  { id: 'usage', label: '💸 Usage' },
  { id: 'settings', label: '⚙️ Settings' },
].map((tab) => (
  // ... rest of code
))}

// Then add this new section before the Overview tab condition:

{/* Chat Tab */}
{activeTab === 'chat' && (
  <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
    <h3 className="text-2xl font-black text-white mb-8">Schedule Meetings with AI</h3>
    <p className="text-purple-300/70 mb-6">
      Use natural language to schedule meetings. Just type what you need!
    </p>
    <ChatWindow hostName={hostName} mode="host" />
  </div>
)}
```

**Also add import at top:**
```typescript
import ChatWindow from '@/components/ChatWindow';
```

#### File 3: Create useCalendar Hook

**Path:** `apps/web/src/hooks/useCalendar.ts`

```typescript
import { useState, useCallback } from 'react';
import axios from 'axios';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  attendees: string[];
}

interface UseCalendarReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  syncCalendar: () => Promise<void>;
  getAvailability: (date: string) => Promise<string[]>;
  createEvent: (event: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  connected: boolean;
}

export function useCalendar(): UseCalendarReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const syncCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/calendar/sync');
      setEvents(response.data.events || []);
      setConnected(true);
    } catch (err) {
      setError('Failed to sync calendar');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAvailability = useCallback(async (date: string) => {
    try {
      const response = await axios.get(`/api/calendar/availability`, {
        params: { date },
      });
      return response.data.availableSlots || [];
    } catch (err) {
      console.error('Failed to get availability:', err);
      return [];
    }
  }, []);

  const createEvent = useCallback(async (event: Partial<CalendarEvent>) => {
    try {
      const response = await axios.post('/api/calendar/events', event);
      setEvents((prev) => [...prev, response.data.event]);
      return response.data.event;
    } catch (err) {
      throw new Error('Failed to create event');
    }
  }, []);

  return {
    events,
    loading,
    error,
    syncCalendar,
    getAvailability,
    createEvent,
    connected,
  };
}
```

---

## SPRINT 5: Calendar Integration & Multi-Participant

#### File 4: Create calendar-core/src/index.ts

**Path:** `packages/calendar-core/src/index.ts`

```typescript
export { GoogleCalendarClient } from './google-calendar';
export { AvailabilityEngine } from './availability-engine';
export { MultiParticipantCoordinator } from './multi-participant';
export type { CalendarEvent, AvailabilitySlot, ParticipantResponse } from './types';
```

#### File 5: Create calendar-core/src/types.ts

**Path:** `packages/calendar-core/src/types.ts`

```typescript
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  location?: string;
  status: 'tentative' | 'confirmed' | 'cancelled';
}

export interface AvailabilitySlot {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
}

export interface ParticipantResponse {
  email: string;
  name: string;
  status: 'accepted' | 'declined' | 'pending';
  responseTime?: string;
}

export interface SchedulingRequest {
  participants: string[];
  proposedDate?: string;
  proposedTime?: string;
  duration: number;
  purpose: string;
  timezone?: string;
}

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken: string;
  refreshToken: string;
}
```

#### File 6: Create calendar-core/src/google-calendar.ts

**Path:** `packages/calendar-core/src/google-calendar.ts`

```typescript
import { google } from 'googleapis';
import { CalendarEvent, GoogleCalendarConfig } from './types';

export class GoogleCalendarClient {
  private calendar: any;
  private config: GoogleCalendarConfig;

  constructor(config: GoogleCalendarConfig) {
    this.config = config;
    const oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
    oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    });
    this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  }

  async getEvents(calendarId: string = 'primary', timeMin?: string, timeMax?: string) {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return response.data.items || [];
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }

  async createEvent(event: Partial<CalendarEvent>, calendarId: string = 'primary') {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: {
          summary: event.title,
          description: event.description,
          start: { dateTime: event.startTime },
          end: { dateTime: event.endTime },
          attendees: event.attendees?.map((email) => ({ email })),
          location: event.location,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, event: Partial<CalendarEvent>, calendarId: string = 'primary') {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: {
          summary: event.title,
          description: event.description,
          start: { dateTime: event.startTime },
          end: { dateTime: event.endTime },
          attendees: event.attendees?.map((email) => ({ email })),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string, calendarId: string = 'primary') {
    try {
      await this.calendar.events.delete({ calendarId, eventId });
      return true;
    } catch (error) {
      console.error('Failed to delete event:', error);
      return false;
    }
  }

  async getFreeBusyTimes(emails: string[], timeMin: string, timeMax: string) {
    try {
      const response = await this.calendar.freebusy.query({
        requestBody: {
          timeMin,
          timeMax,
          items: emails.map((email) => ({ id: email })),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get free/busy times:', error);
      return null;
    }
  }
}
```

#### File 7: Create calendar-core/src/availability-engine.ts

**Path:** `packages/calendar-core/src/availability-engine.ts`

```typescript
import { AvailabilitySlot, CalendarEvent } from './types';

export class AvailabilityEngine {
  private bufferMinutes: number = 15;

  setBuffer(minutes: number) {
    this.bufferMinutes = minutes;
  }

  calculateAvailability(
    events: CalendarEvent[],
    date: string,
    workStartHour: number = 9,
    workEndHour: number = 17,
    slotDuration: number = 30
  ): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    const dayEvents = events.filter((e) => e.startTime.split('T')[0] === date);
    
    dayEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    let currentTime = new Date(`${date}T${String(workStartHour).padStart(2, '0')}:00:00`);
    const endOfDay = new Date(`${date}T${String(workEndHour).padStart(2, '0')}:00:00`);

    for (const event of dayEvents) {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      // Add buffer before event
      const bufferStart = new Date(eventStart.getTime() - this.bufferMinutes * 60000);

      if (currentTime < bufferStart) {
        while (new Date(currentTime.getTime() + slotDuration * 60000) <= bufferStart) {
          const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
          slots.push({
            date,
            startTime: currentTime.toISOString().split('T')[1].slice(0, 5),
            endTime: slotEnd.toISOString().split('T')[1].slice(0, 5),
            duration: slotDuration,
          });
          currentTime = slotEnd;
        }
      }

      currentTime = new Date(eventEnd.getTime() + this.bufferMinutes * 60000);
    }

    // Add remaining slots until end of day
    while (new Date(currentTime.getTime() + slotDuration * 60000) <= endOfDay) {
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
      slots.push({
        date,
        startTime: currentTime.toISOString().split('T')[1].slice(0, 5),
        endTime: slotEnd.toISOString().split('T')[1].slice(0, 5),
        duration: slotDuration,
      });
      currentTime = slotEnd;
    }

    return slots;
  }

  findCommonSlots(availabilityMap: Record<string, AvailabilitySlot[]>, date: string): AvailabilitySlot[] {
    const people = Object.keys(availabilityMap);
    if (people.length === 0) return [];

    const baseSlots = availabilityMap[people[0]];
    return baseSlots.filter((slot) =>
      people.every((person) =>
        availabilityMap[person].some(
          (s) => s.startTime === slot.startTime && s.endTime === slot.endTime
        )
      )
    );
  }
}
```

#### File 8: Create calendar-core/src/multi-participant.ts

**Path:** `packages/calendar-core/src/multi-participant.ts`

```typescript
import { ParticipantResponse, SchedulingRequest } from './types';

export class MultiParticipantCoordinator {
  private invitations: Map<string, ParticipantResponse> = new Map();

  async sendInvitations(request: SchedulingRequest, meetingId: string): Promise<string[]> {
    const inviteIds: string[] = [];

    for (const participant of request.participants) {
      const inviteId = `invite_${Date.now()}_${Math.random()}`;
      this.invitations.set(inviteId, {
        email: participant,
        name: participant.split('@')[0],
        status: 'pending',
      });
      inviteIds.push(inviteId);
    }

    return inviteIds;
  }

  recordResponse(inviteId: string, status: 'accepted' | 'declined', responseTime?: string) {
    const invitation = this.invitations.get(inviteId);
    if (invitation) {
      invitation.status = status;
      invitation.responseTime = responseTime || new Date().toISOString();
      this.invitations.set(inviteId, invitation);
    }
  }

  getResponses(inviteIds: string[]): ParticipantResponse[] {
    return inviteIds
      .map((id) => this.invitations.get(id))
      .filter((inv) => inv !== undefined) as ParticipantResponse[];
  }

  checkAllAccepted(inviteIds: string[]): boolean {
    const responses = this.getResponses(inviteIds);
    return responses.length > 0 && responses.every((r) => r.status === 'accepted');
  }

  getPendingResponses(inviteIds: string[]): ParticipantResponse[] {
    return this.getResponses(inviteIds).filter((r) => r.status === 'pending');
  }
}
```

#### File 9: Create calendar-core/tsconfig.json

**Path:** `packages/calendar-core/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

---

## SPRINT 6: Flexible Booking Modes

#### File 10: Create BookingModeSelector Component

**Path:** `apps/web/src/components/BookingModeSelector.tsx`

```typescript
import React from 'react';

type BookingMode = 'slots' | 'chat' | 'direct';

interface BookingModeSelectorProps {
  currentMode: BookingMode;
  onChange: (mode: BookingMode) => void;
}

export default function BookingModeSelector({ currentMode, onChange }: BookingModeSelectorProps) {
  const modes: Array<{ id: BookingMode; icon: string; label: string; desc: string }> = [
    {
      id: 'slots',
      icon: '📅',
      label: 'Pick a Time',
      desc: 'Select from available time slots',
    },
    {
      id: 'chat',
      icon: '💬',
      label: 'Chat',
      desc: 'Tell me what you need',
    },
    {
      id: 'direct',
      icon: '📝',
      label: 'Request',
      desc: 'Send a meeting request',
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-4 mb-8">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onChange(mode.id)}
          className={`p-6 rounded-xl border-2 transition-all duration-200 ${
            currentMode === mode.id
              ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500 shadow-lg shadow-purple-500/20'
              : 'bg-slate-700/30 border-purple-500/20 hover:border-purple-500/40'
          }`}
        >
          <div className="text-3xl mb-2">{mode.icon}</div>
          <p className="font-bold text-white">{mode.label}</p>
          <p className="text-sm text-purple-300/70 mt-1">{mode.desc}</p>
        </button>
      ))}
    </div>
  );
}
```

#### File 11: Create SlotsBooking Component

**Path:** `apps/web/src/components/SlotsBooking.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SlotsBookingProps {
  meetingId: string;
  onBookingComplete?: (bookingId: string) => void;
}

export default function SlotsBooking({ meetingId, onBookingComplete }: SlotsBookingProps) {
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, [meetingId]);

  const fetchSlots = async () => {
    try {
      const response = await axios.get(`/api/booking/slots?meetingId=${meetingId}`);
      setSlots(response.data.slots || []);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !visitorName || !visitorEmail) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/booking/create', {
        meetingId,
        slot: selectedSlot,
        visitorName,
        visitorEmail,
        mode: 'slots',
      });

      if (onBookingComplete) {
        onBookingComplete(response.data.bookingId);
      }
      alert('Booking confirmed! Check your email.');
    } catch (error) {
      console.error('Failed to book:', error);
      alert('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-purple-300 font-bold mb-3">Available Times</label>
        <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {slots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => setSelectedSlot(slot.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedSlot === slot.id
                  ? 'border-purple-500 bg-purple-600/20'
                  : 'border-purple-500/20 bg-slate-700/30 hover:border-purple-500/40'
              }`}
            >
              <p className="font-bold text-white">{slot.date}</p>
              <p className="text-purple-300">{slot.startTime} - {slot.endTime}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-purple-300 font-bold mb-2">Your Name</label>
        <input
          type="text"
          value={visitorName}
          onChange={(e) => setVisitorName(e.target.value)}
          className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-purple-300 font-bold mb-2">Email</label>
        <input
          type="email"
          value={visitorEmail}
          onChange={(e) => setVisitorEmail(e.target.value)}
          className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
          placeholder="john@example.com"
        />
      </div>

      <button
        onClick={handleBook}
        disabled={!selectedSlot || loading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all"
      >
        {loading ? 'Booking...' : '✓ Confirm Booking'}
      </button>
    </div>
  );
}
```

#### File 12: Create ChatBooking Component

**Path:** `apps/web/src/components/ChatBooking.tsx`

```typescript
import React from 'react';
import ChatWindow from './ChatWindow';

interface ChatBookingProps {
  meetingId: string;
  onBookingComplete?: (bookingId: string) => void;
}

export default function ChatBooking({ meetingId, onBookingComplete }: ChatBookingProps) {
  const handleScheduleConfirmed = (details: any) => {
    if (onBookingComplete) {
      onBookingComplete(details.bookingId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-700/50 border border-purple-500/10 rounded-lg p-4">
        <p className="text-purple-300 text-sm">
          💡 <strong>Tip:</strong> Tell me what you need. For example: "I need 30 minutes next week for a project discussion"
        </p>
      </div>
      <ChatWindow 
        mode="visitor"
        onScheduleConfirmed={handleScheduleConfirmed}
      />
    </div>
  );
}
```

#### File 13: Create DirectBooking Component

**Path:** `apps/web/src/components/DirectBooking.tsx`

```typescript
import React, { useState } from 'react';
import axios from 'axios';

interface DirectBookingProps {
  meetingId: string;
  onRequestSent?: () => void;
}

export default function DirectBooking({ meetingId, onRequestSent }: DirectBookingProps) {
  const [purpose, setPurpose] = useState('');
  const [duration, setDuration] = useState('30');
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!purpose || !visitorName || !visitorEmail) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/booking/request', {
        meetingId,
        purpose,
        duration,
        visitorName,
        visitorEmail,
      });

      setSubmitted(true);
      if (onRequestSent) {
        onRequestSent();
      }
    } catch (error) {
      console.error('Failed to send request:', error);
      alert('Failed to send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <p className="text-3xl mb-3">✅</p>
        <p className="text-white font-bold text-lg">Request Sent!</p>
        <p className="text-purple-300/70 mt-2">The host will review and confirm a time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-purple-300 font-bold mb-2">Meeting Purpose</label>
        <textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="What do you need to discuss?"
          className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-400 resize-none"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-purple-300 font-bold mb-2">How Long? (minutes)</label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
        >
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">1 hour</option>
          <option value="90">1.5 hours</option>
        </select>
      </div>

      <div>
        <label className="block text-purple-300 font-bold mb-2">Your Name</label>
        <input
          type="text"
          value={visitorName}
          onChange={(e) => setVisitorName(e.target.value)}
          className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-purple-300 font-bold mb-2">Email</label>
        <input
          type="email"
          value={visitorEmail}
          onChange={(e) => setVisitorEmail(e.target.value)}
          className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
          placeholder="john@example.com"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all"
      >
        {loading ? 'Sending...' : '✓ Send Request'}
      </button>
    </div>
  );
}
```

#### File 14: Create Visitor Booking Page

**Path:** `apps/web/src/pages/book/[id].tsx`

```typescript
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import BookingModeSelector from '@/components/BookingModeSelector';
import SlotsBooking from '@/components/SlotsBooking';
import ChatBooking from '@/components/ChatBooking';
import DirectBooking from '@/components/DirectBooking';

type BookingMode = 'slots' | 'chat' | 'direct';

export default function VisitorBookingPage() {
  const router = useRouter();
  const { id } = router.query;
  const [mode, setMode] = useState<BookingMode>('slots');

  if (!id) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Schedule a Meeting
          </h1>
          <p className="text-purple-300/70 mt-2">Choose how you'd like to book</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
          <BookingModeSelector currentMode={mode} onChange={setMode} />

          {mode === 'slots' && <SlotsBooking meetingId={id as string} />}
          {mode === 'chat' && <ChatBooking meetingId={id as string} />}
          {mode === 'direct' && <DirectBooking meetingId={id as string} />}
        </div>
      </div>
    </div>
  );
}
```

---

## API Routes to Create

#### File 15: Calendar Sync API

**Path:** `apps/web/src/pages/api/calendar/sync.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Implement Google Calendar OAuth callback
    // For now, return success
    return res.status(200).json({ 
      success: true, 
      events: [] 
    });
  } catch (error) {
    return res.status(500).json({ error: 'Sync failed' });
  }
}
```

#### File 16: Booking Create API

**Path:** `apps/web/src/pages/api/booking/create.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { meetingId, slot, visitorName, visitorEmail, mode } = req.body;

  try {
    // Create booking record
    const bookingId = `booking_${Date.now()}`;

    // TODO: Charge x402 payment if applicable
    // TODO: Send confirmation email

    return res.status(200).json({
      success: true,
      bookingId,
      message: 'Booking confirmed',
    });
  } catch (error) {
    console.error('Booking error:', error);
    return res.status(500).json({ error: 'Booking failed' });
  }
}
```

---

## Quick File Creation Checklist

Print and check off as you create each file:

### Sprint 4 (Chat)
- [ ] Update package.json (add workspaces if needed)
- [ ] Update host/dashboard.tsx (add chat tab)
- [ ] Create hooks/useCalendar.ts

### Sprint 5 (Calendar)
- [ ] Create packages/calendar-core/src/index.ts
- [ ] Create packages/calendar-core/src/types.ts
- [ ] Create packages/calendar-core/src/google-calendar.ts
- [ ] Create packages/calendar-core/src/availability-engine.ts
- [ ] Create packages/calendar-core/src/multi-participant.ts
- [ ] Create packages/calendar-core/tsconfig.json

### Sprint 6 (Booking)
- [ ] Create components/BookingModeSelector.tsx
- [ ] Create components/SlotsBooking.tsx
- [ ] Create components/ChatBooking.tsx
- [ ] Create components/DirectBooking.tsx
- [ ] Create pages/book/[id].tsx
- [ ] Create pages/api/calendar/sync.ts
- [ ] Create pages/api/booking/create.ts

---

## Next Steps After Creating Files

1. **Commit to GitHub**
   ```bash
   git add -A
   git commit -m "Sprint 4, 5, 6: Chat interface, calendar integration, flexible booking modes"
   git push origin main
   ```

2. **On VPS:**
   ```bash
   git pull origin main
   # Add DEEPSEEK_API_KEY and GOOGLE_* keys to .env
   docker compose build --no-cache
   docker compose up -d
   ```

3. **Test:**
   - Visit host dashboard → Chat tab → Test scheduling
   - Visit /book/[id] → Try all 3 booking modes

---

**Copyright (c) 2026 Veer Varma. All rights reserved.**

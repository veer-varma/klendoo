import type { BookingContext } from "./types.js";

/**
 * A manually-seeded test record, per Klendoo_Sprint_Plan.md Sprint 1 scope:
 * "takes a booking context (can be a manually-seeded test record at this
 * stage — no need for the full booking flow yet)". Agent 1 (Booking) doesn't
 * exist yet, so this stands in for a real booking until it does.
 */
export function sampleBookingContext(overrides: Partial<BookingContext> = {}): BookingContext {
  return {
    id: `seed-${Date.now()}`,
    hostName: "Dr. Varma",
    hostEmail: "ops@klendoo.com",
    visitorName: "Test Visitor",
    visitorEmail: "test-visitor@example.com",
    meetingTitle: "Intro call",
    meetingTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

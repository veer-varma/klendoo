import type { PollDraftInput } from "./types.js";

/**
 * A manually-seeded test poll, same spirit as the Reminder agent's
 * sampleBookingContext — no real host-facing form yet (Sprint 2 scope).
 */
export function samplePollDraft(overrides: Partial<PollDraftInput> = {}): PollDraftInput {
  const now = Date.now();
  return {
    hostName: "Priya Raman",
    hostEmail: "priya@priyaraman.coach",
    title: "Kickoff call",
    deadline: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
    slots: [
      {
        startTime: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(now + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      },
      {
        startTime: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(now + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      },
    ],
    invitees: [
      { name: "Alex Souza", email: "alex@example.com" },
      { name: "Jordan Lee", email: "jordan@example.com" },
    ],
    ...overrides,
  };
}

/**
 * A booking context to send a reminder for. Sprint 1 scope: this can be a
 * manually-seeded record (see seedContexts.ts) rather than coming from a
 * real booking flow — Agent 1 (Booking) doesn't exist yet, per the
 * Development Plan's Milestone 1 scope.
 */
export interface BookingContext {
  /** Used as ClientInteraction.contextRef when settling. */
  id: string;
  hostName: string;
  hostEmail: string;
  visitorName: string;
  visitorEmail: string;
  meetingTitle: string;
  /** ISO 8601 timestamp of the meeting being reminded about. */
  meetingTime: string;
}

export interface ReminderResult {
  emailMessageId: string;
  settlement: {
    txnHash: string;
    amount: string;
    interactionId: string;
  };
}

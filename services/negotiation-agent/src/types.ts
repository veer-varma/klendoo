/** One candidate meeting time a host is proposing. */
export interface CandidateSlot {
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
}

/** One person being invited to respond to the poll. */
export interface InviteeInput {
  name: string;
  email: string;
}

/**
 * What a host builds before paying to send it. Sprint 2 scope: no UI yet,
 * this is constructed directly (see seedPolls.ts) the same way Sprint 1's
 * BookingContext was manually seeded — real form/UI is later work.
 */
export interface PollDraftInput {
  hostName: string;
  hostEmail: string;
  title: string;
  /** ISO 8601 — after this, the poll is eligible to close (Sprint 3). */
  deadline: string;
  slots: CandidateSlot[];
  invitees: InviteeInput[];
}

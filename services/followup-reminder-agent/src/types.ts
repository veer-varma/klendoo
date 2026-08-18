/**
 * A booking context to send a reminder for. Sprint 1 scope: this can be a
 * manually-seeded record (see seedContexts.ts) rather than coming from a
 * real booking flow — Agent 1 (Booking) doesn't exist yet, per the
 * Development Plan's Milestone 1 scope.
 *
 * This whole object is the paid request's JSON body — field name
 * `contextRef` is not incidental: payment-core's settlement hooks
 * (paidResource.ts's extractContextRef) read exactly that key back out of
 * the request body to tag the ClientInteraction row. Don't rename it
 * without updating that reader too.
 */
export interface BookingContext {
  contextRef: string;
  hostName: string;
  hostEmail: string;
  visitorName: string;
  visitorEmail: string;
  meetingTitle: string;
  /** ISO 8601 timestamp of the meeting being reminded about. */
  meetingTime: string;
}

import { recordEdgeUsage } from "@klendoo/trust-graph";

/**
 * Agent 2's "hardening" step from the Trust Graph Spec's build order: a
 * poll that finalizes with a confirmed attendee is real evidence this
 * host/invitee pairing follows through, not just that a poll was sent —
 * so this is recorded on finalization, not on poll creation.
 *
 * Best-effort on purpose, same reasoning as the Reminder agent's
 * recordReminderTrust — a trust-write failure must never affect the
 * meeting that's already been confirmed and already had emails sent.
 */
export async function recordNegotiationTrust(hostEmail: string, attendeeEmails: string[]): Promise<void> {
  for (const attendeeEmail of attendeeEmails) {
    try {
      await recordEdgeUsage({
        fromId: hostEmail,
        toId: attendeeEmail,
        edgeType: "RELATIONSHIP",
        actionType: "negotiation",
      });
    } catch (err) {
      console.error(`Failed to record TrustEdge usage for negotiation with ${attendeeEmail} (non-fatal):`, err);
    }
  }
}

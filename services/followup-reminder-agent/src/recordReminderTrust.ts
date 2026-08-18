import { recordEdgeUsage } from "@klendoo/trust-graph";
import type { BookingContext } from "./types.js";

/**
 * Agent 3's "hardening" step from the Trust Graph Spec's build order:
 * every real reminder sent writes/increments a TrustEdge between the host
 * and the recipient. fromId is the host's email, not a HostAccount.id —
 * see @klendoo/trust-graph's README for why that's the honest current
 * state, not an oversight.
 *
 * Best-effort on purpose: a trust-write failure must never fail the
 * reminder itself, which has already sent and already been paid for by
 * the time this runs. Errors are logged, not thrown.
 */
export async function recordReminderTrust(context: BookingContext): Promise<void> {
  try {
    await recordEdgeUsage({
      fromId: context.hostEmail,
      toId: context.visitorEmail,
      edgeType: "RELATIONSHIP",
      actionType: "reminder",
    });
  } catch (err) {
    console.error("Failed to record TrustEdge usage for reminder (non-fatal):", err);
  }
}

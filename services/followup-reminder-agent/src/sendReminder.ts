import { settle, GoPlausibleFacilitator } from "@klendoo/payment-core";
import type { Facilitator } from "@klendoo/payment-core";
import { PostmarkClient } from "./postmark.js";
import type { BookingContext, ReminderResult } from "./types.js";

function buildReminderEmail(context: BookingContext) {
  const when = new Date(context.meetingTime).toUTCString();
  return {
    to: context.visitorEmail,
    subject: `Reminder: ${context.meetingTitle} with ${context.hostName}`,
    textBody:
      `Hi ${context.visitorName},\n\n` +
      `This is a reminder for "${context.meetingTitle}" with ${context.hostName}, ` +
      `scheduled for ${when}.\n\n— Sent by Klendoo`,
  };
}

/**
 * Sends a reminder email for a booking context, then settles a "reminder"
 * action via payment-core. Order matters: we only settle after the email
 * actually sends — a failed send should not create a paid interaction.
 *
 * This is Agent 3 (Reminder & Follow-up) per the Development Plan's
 * Milestone 1 — the smallest agent in the five-agent network, chosen first
 * because it has no Google Calendar OAuth dependency.
 *
 * `facilitator` defaults to the real GoPlausibleFacilitator (still a stub
 * as of Sprint 1 — see the README) but is injectable so tests, and any
 * future non-GoPlausible facilitator, don't have to go through it.
 */
export async function sendReminder(
  context: BookingContext,
  postmark: PostmarkClient = new PostmarkClient(),
  facilitator: Facilitator = new GoPlausibleFacilitator(),
): Promise<ReminderResult> {
  const email = buildReminderEmail(context);
  const { messageId } = await postmark.sendEmail(email);

  const settlement = await settle("reminder", { contextRef: context.id }, facilitator);

  return {
    emailMessageId: messageId,
    settlement: {
      txnHash: settlement.txnHash,
      amount: settlement.amount,
      interactionId: settlement.interactionId,
    },
  };
}

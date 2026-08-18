import type { SendEmailParams } from "@klendoo/email";
import type { BookingContext } from "./types.js";

/**
 * Pure — no I/O — so it's testable without a Postmark client or a running
 * server. Used by server.ts's route handler.
 */
export function buildReminderEmail(context: BookingContext): SendEmailParams {
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

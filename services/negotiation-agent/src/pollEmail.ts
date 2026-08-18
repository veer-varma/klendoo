import type { SendEmailParams } from "@klendoo/email";

export interface PollEmailInput {
  hostName: string;
  title: string;
  deadline: string;
  inviteeName: string;
  inviteeEmail: string;
  responseUrl: string;
  slots: { startTime: string; endTime: string }[];
}

function formatSlot(startTime: string): string {
  return new Date(startTime).toUTCString();
}

export function buildPollInvitationEmail(input: PollEmailInput): SendEmailParams {
  const deadline = new Date(input.deadline).toUTCString();
  const slotLines = input.slots.map((s, i) => `  ${i + 1}. ${formatSlot(s.startTime)}`).join("\n");

  return {
    to: input.inviteeEmail,
    subject: `${input.hostName} wants to find time for "${input.title}"`,
    textBody:
      `Hi ${input.inviteeName},\n\n` +
      `${input.hostName} is trying to schedule "${input.title}" and wants to know which of these times work for you:\n\n` +
      `${slotLines}\n\n` +
      `Let us know by ${deadline}: ${input.responseUrl}\n\n— Sent by Klendoo`,
  };
}

export function buildReconsiderEmail(input: PollEmailInput & { winningSlot: { startTime: string } }): SendEmailParams {
  return {
    to: input.inviteeEmail,
    subject: `Most people can do ${formatSlot(input.winningSlot.startTime)} — can you?`,
    textBody:
      `Hi ${input.inviteeName},\n\n` +
      `For "${input.title}" with ${input.hostName}, most people picked ${formatSlot(input.winningSlot.startTime)}, ` +
      `which you said didn't work. If there's any way to make it work, let us know here: ${input.responseUrl}\n\n` +
      `Otherwise no action needed — we'll go with the group.\n\n— Sent by Klendoo`,
  };
}

export interface ConfirmationEmailInput {
  hostName: string;
  title: string;
  winningSlot: { startTime: string; endTime: string };
}

/** Sent to each invitee who marked the winning slot available — the actual attendees. */
export function buildAttendeeConfirmationEmail(
  input: ConfirmationEmailInput & { inviteeName: string; inviteeEmail: string },
): SendEmailParams {
  return {
    to: input.inviteeEmail,
    subject: `Confirmed: "${input.title}" — ${formatSlot(input.winningSlot.startTime)}`,
    textBody:
      `Hi ${input.inviteeName},\n\n` +
      `"${input.title}" with ${input.hostName} is confirmed for ${formatSlot(input.winningSlot.startTime)}.\n\n` +
      `— Sent by Klendoo`,
  };
}

/** Sent to the host once a poll finalizes, listing who's actually confirmed. */
export function buildHostConfirmationEmail(
  input: ConfirmationEmailInput & { hostEmail: string; attendeeNames: string[] },
): SendEmailParams {
  const attendees = input.attendeeNames.length > 0 ? input.attendeeNames.join(", ") : "no one else";
  return {
    to: input.hostEmail,
    subject: `Confirmed: "${input.title}" — ${formatSlot(input.winningSlot.startTime)}`,
    textBody:
      `Hi ${input.hostName},\n\n` +
      `"${input.title}" is confirmed for ${formatSlot(input.winningSlot.startTime)}, with ${attendees}.\n\n` +
      `— Sent by Klendoo`,
  };
}

/** Sent to the host only — nobody marked any candidate slot as available. */
export function buildNoConsensusEmail(input: {
  hostName: string;
  hostEmail: string;
  title: string;
}): SendEmailParams {
  return {
    to: input.hostEmail,
    subject: `No one could make any of the times for "${input.title}"`,
    textBody:
      `Hi ${input.hostName},\n\n` +
      `Nobody marked any of the proposed times as available for "${input.title}". ` +
      `You'll need to propose new times.\n\n— Sent by Klendoo`,
  };
}

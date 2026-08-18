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

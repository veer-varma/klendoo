import { getDb } from "@klendoo/db";
import { PostmarkClient } from "@klendoo/email";
import { computeMajoritySlot } from "./majority.js";
import {
  buildAttendeeConfirmationEmail,
  buildHostConfirmationEmail,
  buildReconsiderEmail,
  buildNoConsensusEmail,
} from "./pollEmail.js";
import { recordNegotiationTrust } from "./recordNegotiationTrust.js";

export interface ClosePollResult {
  pollId: string;
  outcome: "FINALIZED" | "CANCELLED";
  winningSlotId?: string;
}

/**
 * Closes an OPEN poll: computes the majority slot (majority of responders,
 * earliest slot wins a tie — see majority.ts), writes the CalendarEvent,
 * and notifies everyone. If nobody marked anything available, cancels the
 * poll and tells the host instead of finalizing an empty meeting.
 *
 * Reconsideration is a courtesy notice, not a re-vote: the winning slot is
 * decided and the CalendarEvent is written in this same call — people who
 * couldn't make it are told the plan and invited to flag if they truly
 * can't attend, not held in a second round that could flip the outcome.
 * That's the practical reading of "reach out to others... to reconsider" —
 * worth confirming with Veer if a real re-vote is wanted instead.
 *
 * Closing itself isn't a separate paid x402 action — the host already paid
 * once to run this negotiation when the poll was activated; resolving it
 * is completing what was already paid for, not a new billable event. Worth
 * confirming if the business model actually wants this separately priced.
 */
export async function closeAndFinalizePoll(
  pollId: string,
  postmark: PostmarkClient = new PostmarkClient(),
): Promise<ClosePollResult> {
  const db = getDb();

  const poll = await db.schedulingPoll.findUnique({
    where: { id: pollId },
    include: { slots: true, invitees: { include: { responses: true } } },
  });
  if (!poll) throw new Error(`Poll ${pollId} not found.`);
  if (poll.status !== "OPEN") {
    throw new Error(`Poll ${pollId} is ${poll.status}, not OPEN — cannot close.`);
  }

  const allResponses = poll.invitees.flatMap((inv) =>
    inv.responses.map((r) => ({ slotId: r.slotId, available: r.available })),
  );
  const majority = computeMajoritySlot(
    poll.slots.map((s) => ({ id: s.id, startTime: s.startTime.toISOString() })),
    allResponses,
  );

  if (!majority) {
    await db.schedulingPoll.update({
      where: { id: poll.id },
      data: { status: "CANCELLED", closedAt: new Date() },
    });
    await postmark.sendEmail(
      buildNoConsensusEmail({ hostName: poll.hostName, hostEmail: poll.hostEmail, title: poll.title }),
    );
    return { pollId: poll.id, outcome: "CANCELLED" };
  }

  const winningSlot = poll.slots.find((s) => s.id === majority.winningSlotId);
  if (!winningSlot) throw new Error("Majority slot not found among poll slots — data inconsistency.");

  const availableInvitees = poll.invitees.filter((inv) =>
    inv.responses.some((r) => r.slotId === winningSlot.id && r.available),
  );
  const unavailableInvitees = poll.invitees.filter(
    (inv) => !availableInvitees.some((a) => a.id === inv.id),
  );

  await db.schedulingPoll.update({
    where: { id: poll.id },
    data: { status: "CLOSED", winningSlotId: winningSlot.id, closedAt: new Date() },
  });

  await db.calendarEvent.create({
    data: {
      hostEmail: poll.hostEmail,
      title: poll.title,
      startTime: winningSlot.startTime,
      endTime: winningSlot.endTime,
      attendees: availableInvitees.map((i) => i.email).join(", "),
      pollId: poll.id,
    },
  });

  await db.schedulingPoll.update({ where: { id: poll.id }, data: { status: "FINALIZED" } });

  await recordNegotiationTrust(poll.hostEmail, availableInvitees.map((i) => i.email));

  const winningSlotEmailShape = {
    startTime: winningSlot.startTime.toISOString(),
    endTime: winningSlot.endTime.toISOString(),
  };

  for (const invitee of availableInvitees) {
    await postmark.sendEmail(
      buildAttendeeConfirmationEmail({
        hostName: poll.hostName,
        title: poll.title,
        winningSlot: winningSlotEmailShape,
        inviteeName: invitee.name,
        inviteeEmail: invitee.email,
      }),
    );
  }

  for (const invitee of unavailableInvitees) {
    await postmark.sendEmail(
      buildReconsiderEmail({
        hostName: poll.hostName,
        title: poll.title,
        deadline: poll.deadline.toISOString(),
        inviteeName: invitee.name,
        inviteeEmail: invitee.email,
        responseUrl: `${requirePublicBaseUrl()}/polls/${invitee.token}`,
        slots: poll.slots.map((s) => ({
          startTime: s.startTime.toISOString(),
          endTime: s.endTime.toISOString(),
        })),
        winningSlot: winningSlotEmailShape,
      }),
    );
    await db.pollInvitee.update({ where: { id: invitee.id }, data: { reconsiderSentAt: new Date() } });
  }

  await postmark.sendEmail(
    buildHostConfirmationEmail({
      hostName: poll.hostName,
      hostEmail: poll.hostEmail,
      title: poll.title,
      winningSlot: winningSlotEmailShape,
      attendeeNames: availableInvitees.map((i) => i.name),
    }),
  );

  return { pollId: poll.id, outcome: "FINALIZED", winningSlotId: winningSlot.id };
}

function requirePublicBaseUrl(): string {
  const url = process.env.PUBLIC_BASE_URL;
  if (!url) {
    throw new Error("PUBLIC_BASE_URL is not set — needed to build the reconsider-email response link.");
  }
  return url.replace(/\/$/, "");
}

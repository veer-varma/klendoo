import { getDb } from "@klendoo/db";
import type { SchedulingPoll } from "@klendoo/db";

export class InvalidMeetingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidMeetingError";
  }
}

export class HostNotFoundError extends Error {
  constructor() {
    super("Host account not found.");
    this.name = "HostNotFoundError";
  }
}

export interface CandidateSlotInput {
  startTime: string; // ISO 8601 / datetime-local value
  endTime: string;
}

export interface InviteeInput {
  name: string;
  email: string;
}

export interface CreateMeetingInput {
  title: string;
  deadline: string;
  slots: CandidateSlotInput[];
  invitees: InviteeInput[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Creates a DRAFT poll owned by this host — the real, form-driven
 * replacement for services/negotiation-agent's CLI-only seedPolls.ts path
 * (Sprint 6b). Still just a draft: nothing is sent and no payment has
 * happened. Activating it (notifying invitees) is the negotiation agent's
 * paid /agents/negotiate endpoint, which this dashboard deliberately does
 * NOT call — that endpoint requires a completed Intermezzo payment, which
 * isn't wired up yet (see BACKLOG.md). The detail page surfaces this
 * plainly rather than pretending the poll went out.
 */
export async function createHostMeeting(hostId: string, input: CreateMeetingInput): Promise<SchedulingPoll> {
  const db = getDb();
  const host = await db.hostAccount.findUnique({ where: { id: hostId } });
  if (!host) throw new HostNotFoundError();

  const title = input.title.trim();
  if (!title) throw new InvalidMeetingError("Title is required.");

  const deadline = new Date(input.deadline);
  if (Number.isNaN(deadline.getTime())) throw new InvalidMeetingError("A valid deadline is required.");

  const slots = input.slots
    .map((s) => ({ startTime: new Date(s.startTime), endTime: new Date(s.endTime) }))
    .filter((s) => !Number.isNaN(s.startTime.getTime()) && !Number.isNaN(s.endTime.getTime()));
  if (slots.length === 0) throw new InvalidMeetingError("At least one candidate time slot is required.");
  if (slots.some((s) => s.endTime <= s.startTime)) {
    throw new InvalidMeetingError("Each slot's end time must be after its start time.");
  }

  const invitees = input.invitees
    .map((i) => ({ name: i.name.trim(), email: i.email.trim() }))
    .filter((i) => i.name && i.email);
  if (invitees.length === 0) throw new InvalidMeetingError("At least one invitee (name + email) is required.");
  const badEmail = invitees.find((i) => !EMAIL_RE.test(i.email));
  if (badEmail) throw new InvalidMeetingError(`"${badEmail.email}" doesn't look like a valid email address.`);

  return db.schedulingPoll.create({
    data: {
      hostId,
      hostName: host.businessName,
      hostEmail: host.email,
      title,
      deadline,
      slots: { create: slots },
      invitees: { create: invitees },
    },
  });
}

export function listHostMeetings(hostId: string) {
  return getDb().schedulingPoll.findMany({
    where: { hostId },
    include: { slots: true, invitees: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getHostMeeting(hostId: string, pollId: string) {
  const poll = await getDb().schedulingPoll.findUnique({
    where: { id: pollId },
    include: { slots: true, invitees: { include: { responses: true } } },
  });
  if (!poll || poll.hostId !== hostId) return null;
  return poll;
}

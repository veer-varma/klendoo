import { getDb } from "@klendoo/db";
import type { SchedulingPoll } from "@klendoo/db";
import type { PollDraftInput } from "./types.js";

/**
 * Persists a poll in DRAFT status with its slots and invitees. Nothing is
 * sent yet, and no payment has happened — that's the paid /agents/negotiate
 * endpoint's job (server.ts), which flips DRAFT -> OPEN.
 *
 * Unlike Sprint 1's BookingContext (an ephemeral in-memory object), a poll
 * has to be a real row before the paid endpoint can reference it by id and
 * before invitees can have real, unique response tokens — so this writes to
 * the DB directly rather than staying in memory.
 */
export async function createDraftPoll(input: PollDraftInput): Promise<SchedulingPoll> {
  return getDb().schedulingPoll.create({
    data: {
      hostName: input.hostName,
      hostEmail: input.hostEmail,
      title: input.title,
      deadline: new Date(input.deadline),
      slots: {
        create: input.slots.map((s) => ({
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
        })),
      },
      invitees: {
        create: input.invitees.map((i) => ({ name: i.name, email: i.email })),
      },
    },
  });
}

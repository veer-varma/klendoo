import { getDb } from "@klendoo/db";
import { closeAndFinalizePoll, type ClosePollResult } from "./closePoll.js";

/**
 * Finds every OPEN poll past its deadline and closes each one.
 *
 * This is the logic; it is NOT wired to run on a schedule anywhere. Nothing
 * in this codebase runs on a timer yet — every agent so far has acted in
 * response to something happening right now (a payment settling, an email
 * arriving). Actually invoking this periodically needs a real scheduler
 * (a cron job, a scheduled CI workflow, a worker service) once there's
 * somewhere deployed to run it — that's Ops/deploy scope, not something to
 * fake here. Until then, call this by hand (closePollsCli.ts) or from a
 * test/ops script.
 */
export async function closeExpiredPolls(now: Date = new Date()): Promise<ClosePollResult[]> {
  const expired = await getDb().schedulingPoll.findMany({
    where: { status: "OPEN", deadline: { lt: now } },
    select: { id: true },
  });

  const results: ClosePollResult[] = [];
  for (const poll of expired) {
    results.push(await closeAndFinalizePoll(poll.id));
  }
  return results;
}

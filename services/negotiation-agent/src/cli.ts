#!/usr/bin/env node
/**
 * Creates a draft poll (writes directly to the DB — see createDraftPoll.ts)
 * then pays to activate it as a specific custodial user, via the
 * Intermezzo gateway. Same "pay for real" spirit as the Reminder agent's
 * cli.ts, applied to a poll instead of a single reminder.
 *
 * Requires: a reachable DATABASE_URL, the negotiation-agent server running
 * somewhere (--url), a custodial user_id that already exists in Intermezzo
 * (--user), and INTERMEZZO_GATEWAY_URL / KLENDOO_INTERMEZZO_API_KEY set.
 *
 * Usage:
 *   npm run trigger --workspace=@klendoo/negotiation-agent -- \
 *     --user host-123 --url http://localhost:4022/agents/negotiate
 */
import "dotenv/config";
import { payViaIntermezzo } from "@klendoo/payment-core";
import { createDraftPoll } from "./createDraftPoll.js";
import { samplePollDraft } from "./seedPolls.js";

function parseArgs(argv: string[]): { user?: string; url?: string } {
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return { user: get("--user"), url: get("--url") };
}

async function main() {
  const { user, url } = parseArgs(process.argv.slice(2));

  if (!user || !url) {
    console.error("Usage: --user <custodial user_id> --url <http(s)://.../agents/negotiate>");
    process.exitCode = 1;
    return;
  }

  const draft = await createDraftPoll(samplePollDraft());
  console.log(`Created draft poll ${draft.id} — paying to activate and notify invitees.`);

  const targetUrl = `${url}?contextRef=${draft.id}`;
  const result = await payViaIntermezzo(user, targetUrl);
  console.log("Done:", result);
}

main().catch((err) => {
  console.error("Poll trigger failed:", err);
  process.exitCode = 1;
});

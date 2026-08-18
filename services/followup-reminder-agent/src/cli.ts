#!/usr/bin/env node
/**
 * Pays and triggers a running Reminder agent server (server.ts) as a
 * specific custodial user, via the Intermezzo gateway. This replaces
 * Sprint 0/1's in-process CLI — there's no longer an in-process settle()
 * call to invoke directly, because x402 is buyer-initiated: the only way
 * to genuinely exercise the paid endpoint is to actually pay it.
 *
 * The endpoint is GET-only (see server.ts for why), so the booking context
 * travels as query params on the target URL.
 *
 * Requires: the server running somewhere reachable (--url), a custodial
 * user_id that already exists in Intermezzo (--user), and
 * INTERMEZZO_GATEWAY_URL / KLENDOO_INTERMEZZO_API_KEY in the environment.
 *
 * Usage:
 *   npm run trigger --workspace=@klendoo/followup-reminder-agent -- \
 *     --user host-123 --url http://localhost:4021/agents/reminder
 */
import { payViaIntermezzo } from "@klendoo/payment-core";
import { sampleBookingContext } from "./seedContexts.js";
import { contextToQueryString } from "./reminderContextQuery.js";

function parseArgs(argv: string[]): { user?: string; url?: string; to?: string } {
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return { user: get("--user"), url: get("--url"), to: get("--to") };
}

async function main() {
  const { user, url, to } = parseArgs(process.argv.slice(2));

  if (!user || !url) {
    console.error("Usage: --user <custodial user_id> --url <http(s)://.../agents/reminder> [--to <email>]");
    process.exitCode = 1;
    return;
  }

  const context = sampleBookingContext(to ? { visitorEmail: to } : {});
  const targetUrl = `${url}?${contextToQueryString(context)}`;
  console.log("Triggering paid reminder for context:", context);

  const result = await payViaIntermezzo(user, targetUrl);
  console.log("Done:", result);
}

main().catch((err) => {
  console.error("Reminder trigger failed:", err);
  process.exitCode = 1;
});

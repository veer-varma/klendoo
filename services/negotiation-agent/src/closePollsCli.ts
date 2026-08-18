#!/usr/bin/env node
/**
 * Manually invokes closeExpiredPolls() — see that file for why nothing
 * calls this on a schedule yet. Run this by hand for now; wiring it to a
 * real cron/scheduled job is deploy-time Ops scope, not something to fake
 * here without real infrastructure to run it on.
 *
 * Requires: DATABASE_URL, POSTMARK_SERVER_API_TOKEN, PUBLIC_BASE_URL.
 *
 * Usage:
 *   npm run close-polls --workspace=@klendoo/negotiation-agent
 */
import "dotenv/config";
import { closeExpiredPolls } from "./closeExpiredPolls.js";

async function main() {
  const results = await closeExpiredPolls();
  if (results.length === 0) {
    console.log("No expired open polls to close.");
    return;
  }
  for (const r of results) {
    console.log(`Poll ${r.pollId}: ${r.outcome}${r.winningSlotId ? ` (slot ${r.winningSlotId})` : ""}`);
  }
}

main().catch((err) => {
  console.error("closeExpiredPolls failed:", err);
  process.exitCode = 1;
});

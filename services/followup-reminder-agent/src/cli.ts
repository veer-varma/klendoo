#!/usr/bin/env node
/**
 * Minimal CLI trigger for manual/local testing, per Klendoo_Sprint_Plan.md:
 * "A minimal way to actually trigger this for testing — a simple API
 * endpoint or CLI script is fine, doesn't need a UI yet."
 *
 * Usage:
 *   npm run trigger --workspace=@klendoo/followup-reminder-agent
 *   npm run trigger --workspace=@klendoo/followup-reminder-agent -- --to someone@example.com
 */
import { sendReminder } from "./sendReminder.js";
import { sampleBookingContext } from "./seedContexts.js";

function parseArgs(argv: string[]): { to?: string } {
  const toIndex = argv.indexOf("--to");
  return { to: toIndex >= 0 ? argv[toIndex + 1] : undefined };
}

async function main() {
  const { to } = parseArgs(process.argv.slice(2));
  const context = sampleBookingContext(to ? { visitorEmail: to } : {});

  console.log("Triggering reminder for context:", context);
  const result = await sendReminder(context);
  console.log("Done:", result);
}

main().catch((err) => {
  console.error("Reminder trigger failed:", err);
  process.exitCode = 1;
});

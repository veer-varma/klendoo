# followup-reminder-agent (Agent 3)

Sends a reminder email (via Postmark) for a booking context, then settles a
`"reminder"` action through `@klendoo/payment-core`. This is Milestone 1 /
Sprint 1's shipping slice per `Klendoo_Development_Plan.md` — the smallest
agent in the five-agent network, chosen first because it has no Google
Calendar OAuth dependency.

Booking contexts are manually seeded (`sampleBookingContext()`) rather than
coming from a real booking flow — Agent 1 (Booking) doesn't exist yet.

## Try it locally

```bash
# requires POSTMARK_SERVER_API_TOKEN in your environment/.env
npm run trigger --workspace=@klendoo/followup-reminder-agent -- --to you@example.com
```

## Provider note

The Sprint Plan assumes SendGrid; the actual provisioned environment
(`Klendoo_Environment_Handoff_FROM_MANUS.md`) set up Postmark instead
(`POSTMARK_SERVER_API_TOKEN` exists, no SendGrid secret does) — this agent
is built against Postmark's REST API directly, no SDK dependency.

## Settlement note

`settle()` still uses the Sprint 0 `GoPlausibleFacilitator` stub — it
throws rather than actually calling GoPlausible, because their real API
isn't documented anywhere in this project (flagged as an open risk since
the original MVP plan). Wiring this up for real needs GoPlausible's actual
API reference, not a guess at their request/response shape.

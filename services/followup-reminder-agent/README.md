# followup-reminder-agent (Agent 3)

A real x402-gated endpoint: `GET /agents/reminder`. Whoever calls it pays
Klendoo (`payTo` = `KLENDOO_PAYTO_ADDRESS`) to trigger a reminder email —
this is Milestone 1 / Sprint 1's shipping slice per
`Klendoo_Development_Plan.md`, the smallest agent in the five-agent network,
chosen first because it has no Google Calendar OAuth dependency.

## Why GET, and why query params instead of a body

The real payer for this endpoint, per Veer's wallet model (2026-08-17), is
a specific person's custodial wallet, paid through Klendoo's Intermezzo
gateway. Intermezzo's own `x402/fetch` reference implementation
(`x402-client.service.ts`) always issues a plain `GET` with no body — so
this endpoint has to be GET, and the booking context travels as query
params (`reminderContextQuery.ts`) instead of a JSON body. Booking contexts
are manually seeded (`sampleBookingContext()`) rather than coming from a
real booking flow — Agent 1 (Booking) doesn't exist yet.

## Running it locally

```bash
# Server — needs KLENDOO_PAYTO_ADDRESS, POSTMARK_SERVER_API_TOKEN, ALGOD_NETWORK
npm run build --workspace=@klendoo/followup-reminder-agent
npm run start --workspace=@klendoo/followup-reminder-agent

# CLI — pays it as a specific custodial user via Intermezzo, needs
# INTERMEZZO_GATEWAY_URL + KLENDOO_INTERMEZZO_API_KEY
npm run trigger --workspace=@klendoo/followup-reminder-agent -- \
  --user host-123 --url http://localhost:4021/agents/reminder
```

`INTERMEZZO_GATEWAY_URL` isn't finalized yet as of Manus's 2026-08-17
handoff ("the final network attachment and stable internal gateway route
must be added through the separate intermezzo-infra deployment") — the CLI
will fail clearly until it is.

## Open question, flagged not assumed

`KLENDOO_PAYTO_ADDRESS` defaults to nothing — it must be set explicitly.
The current best candidate is the Intermezzo manager wallet Manus
provisioned (same wallet that funds every person's custodial wallet), but
that's this codebase's assumption, not a confirmed decision.

## Settlement path

`payment-core`'s `createResourceServer()` handles verify/settle
automatically via `@x402/express`'s `paymentMiddleware` — there's no
imperative "spend" call in this service. `onAfterSettle`/`onSettleFailure`
log the real transaction hash to `ClientInteraction` before this route's
handler ever runs (see `packages/payment-core/src/paidResource.ts`).

## Provider note

The Sprint Plan assumes SendGrid; the actual provisioned environment
(`Klendoo_Environment_Handoff_FROM_MANUS.md`) set up Postmark instead
(`POSTMARK_SERVER_API_TOKEN` exists, no SendGrid secret does) — this agent
is built against Postmark's REST API directly, no SDK dependency.

## Known limitation

Settlement happens *before* this route's handler runs — if Postmark is
down, the caller has already paid before Klendoo knows the email can't be
sent. There's no clean rollback for that in x402 today; the handler logs
and returns a 500, but the ClientInteraction stays SETTLED. Worth
revisiting once real usage data exists.

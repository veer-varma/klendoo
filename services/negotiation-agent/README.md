# negotiation-agent (Agent 2)

Per Veer's 2026-08-17 direction: no Google Calendar OAuth yet (deferred),
Klendoo's own calendar (`CalendarEvent`) is the source of truth for now —
Google/Outlook sync is later work that reads/writes into this same model.

## What this does

1. A host builds a poll (candidate times + invitees) — no UI yet, see
   `seedPolls.ts`, same manually-seeded pattern the Reminder agent started
   with. Written to the DB as `DRAFT` (`createDraftPoll.ts`).
2. Paying `GET /agents/negotiate?contextRef=<pollId>` (x402-gated, same
   pattern as the Reminder agent) flips it to `OPEN` and emails every
   invitee their own link with the candidate times.
3. Each invitee visits `GET /polls/:token` — a plain HTML page, no login —
   and checks every slot that works for them, `POST`ed back to the same URL.
4. `closeExpiredPolls()` finds every `OPEN` poll past its deadline and
   closes each one (`closePoll.ts`): computes the majority slot (majority of
   *responders*, earliest slot wins a tie — explicit product decisions from
   Veer, not defaults this code invented), writes the `CalendarEvent`,
   emails the confirmed attendees and the host, and sends a "most people
   picked this, can you reconsider?" note to whoever couldn't make it. If
   nobody marked anything available at all, the poll is cancelled and the
   host is told, instead of finalizing an empty meeting.

Reconsideration is a courtesy notice, not a re-vote — the winning slot is
decided and the calendar event written in the same call that sends those
emails, not held open pending a reply. Worth confirming with Veer if an
actual re-vote is wanted instead.

## The one real gap: nothing calls closeExpiredPolls() on a schedule

Every agent so far has acted in response to something happening right now
— a payment settling, an email arriving. Closing polls is the first thing
that needs to happen automatically *after a deadline passes*, and nothing
in this codebase runs on a timer. `closePollsCli.ts` lets you trigger it by
hand; wiring it to a real cron/scheduled job needs actual deployed
infrastructure to run it on, which doesn't exist yet — that's Ops scope
once there's somewhere to deploy to, not something to fake here.

## Why GET, and why a draft-then-pay flow

Same reasoning as the Reminder agent: Intermezzo's `x402/fetch` gateway
only ever issues a plain `GET` with no body. A poll has more shape than
fits cleanly in a query string (multiple slots, multiple invitees), so
instead of trying to cram arrays into query params, the poll is built and
persisted first (free, internal), and payment is what activates and sends
it — closer to how a real "build then submit" form would work anyway.

Closing a poll isn't a separate paid x402 action either — the host already
paid once to run the negotiation when the poll was activated; resolving it
is completing what was already paid for, not a new billable event. Worth
confirming if the business model actually wants this priced separately.

## Running it locally

```bash
# Server — needs KLENDOO_PAYTO_ADDRESS, PUBLIC_BASE_URL, POSTMARK_SERVER_API_TOKEN
npm run build --workspace=@klendoo/negotiation-agent
npm run start --workspace=@klendoo/negotiation-agent

# CLI — creates a draft poll, then pays to activate it as a specific
# custodial user via Intermezzo. Needs DATABASE_URL, INTERMEZZO_GATEWAY_URL,
# KLENDOO_INTERMEZZO_API_KEY.
npm run trigger --workspace=@klendoo/negotiation-agent -- \
  --user host-123 --url http://localhost:4022/agents/negotiate

# Manually close every expired open poll — needs DATABASE_URL,
# POSTMARK_SERVER_API_TOKEN, PUBLIC_BASE_URL.
npm run close-polls --workspace=@klendoo/negotiation-agent
```

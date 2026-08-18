# negotiation-agent (Agent 2)

Sprint 2 slice, per Veer's 2026-08-17 direction: no Google Calendar OAuth
yet (deferred), Klendoo's own calendar (`CalendarEvent`, added this sprint)
is the source of truth for now — Google/Outlook sync is later work that
reads/writes into this same model.

## What this does

1. A host builds a poll (candidate times + invitees) — no UI yet, see
   `seedPolls.ts`, same manually-seeded pattern the Reminder agent started
   with. Written to the DB as `DRAFT` (`createDraftPoll.ts`).
2. Paying `GET /agents/negotiate?contextRef=<pollId>` (x402-gated, same
   pattern as the Reminder agent) flips it to `OPEN` and emails every
   invitee their own link with the candidate times.
3. Each invitee visits `GET /polls/:token` — a plain HTML page, no login —
   and checks every slot that works for them, `POST`ed back to the same URL.

**Not built yet (Sprint 3):** the deadline-triggered close, majority
computation (majority of *responders*, earliest slot wins a tie — both
explicit product decisions, not defaults picked by this code), the
reconsideration outreach to people who couldn't make the winning slot, and
writing the confirmed `CalendarEvent`. The schema already has the shape for
all of this (`SchedulingPoll.status`, `winningSlotId`,
`PollInvitee.reconsiderSentAt`) so Sprint 3 extends rather than migrates.

## Why GET, and why a draft-then-pay flow

Same reasoning as the Reminder agent: Intermezzo's `x402/fetch` gateway
only ever issues a plain `GET` with no body. A poll has more shape than
fits cleanly in a query string (multiple slots, multiple invitees), so
instead of trying to cram arrays into query params, the poll is built and
persisted first (free, internal), and payment is what activates and sends
it — closer to how a real "build then submit" form would work anyway.

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
```

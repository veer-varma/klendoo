# Backlog

Living document — update this alongside code changes, don't let it drift.
Items move to "Done" with the PR/commit that closed them, never deleted
outright (history of what was cut and why is worth keeping).

## Blocking deploy (nothing ships until these clear)

- **Legacy VPS stack unresolved.** `klendoo-web`/`klendoo-db` (a separate,
  older deployment) still own `klendoo.com` and `staging.klendoo.com`.
  Manus's own inventory plan never got past Stage 1 — blocked on real VPS
  shell access (Hostinger web terminal 403s, SSH root recovery failed
  twice). "Staging" isn't actually isolated today — it aliases production.
- **Intermezzo gateway URL not finalized.** `INTERMEZZO_GATEWAY_URL` has no
  value yet; the Klendoo-side adapter (`payViaIntermezzo`) is built and
  tested but has never been exercised against a live gateway.
- **No real settlement tested end-to-end.** Intermezzo's TestNet wallets
  (manager + disposable payer) have ALGO but zero USDC — blocked on a
  Circle TestNet faucet rate limit, last we heard from Manus.
- **`KLENDOO_PAYTO_ADDRESS` unconfirmed.** Every paid endpoint's server
  refuses to start without it set. Current best guess is the Intermezzo
  manager wallet — never explicitly confirmed as the right address.
- **Mainnet explicitly not authorized** (Manus's Claude Development
  Handoff, 2026-08-17) until a real TestNet settlement succeeds and there's
  fresh written sign-off.

## Owned by Veer directly (not Manus, not this codebase's open questions)

- **Payment gateway integration for Entrepreneur plan billing.** Veer will
  send this over later (2026-08-17). Confirms the billing rail question
  Sprint 4 had flagged as an inference — no longer open, just waiting on
  the actual integration details/credentials. `StripeBillingProvider`
  (`services/host-onboarding/src/billing/`) is built to receive whatever
  this turns out to be — if it's not Stripe, swap the `BillingProvider`
  implementation, the interface (`startSubscription`) doesn't assume Stripe
  specifically.

## Open product decisions needed from Veer

- **Reconsideration = courtesy notice or real re-vote?** Sprint 3 built it
  as a courtesy notice sent *after* the winning slot and calendar event are
  already decided — not a re-vote that could flip the outcome. That's my
  reading of "reach out to others to reconsider," not something Veer
  explicitly confirmed.
- **Is poll-closing a billable action?** Currently free — the host already
  paid once to activate the poll; closing/finalizing completes what was
  already paid for. Worth confirming this matches the intended pricing
  model.
- **Contacts are phone-only but invites are email-only.** Sprint 6b's
  `Contact` model deliberately only has name + phone, per Veer's exact
  request ("name and phone number"). But poll invitations are still sent by
  Postmark email — there's no SMS/voice channel yet — so inviting a saved
  contact to a meeting still requires typing that person's email at invite
  time; it's not saved on the Contact. This is a real gap between what's
  captured and what's usable today, not just a nice-to-have. Options once
  Veer weighs in: add an optional email to Contact now (contradicts the
  literal request), or wait for a real SMS/voice invite channel to make
  phone-only contacts fully self-sufficient.

## In progress — Sprint 5 (2026-08-18)

Confirmed scope: Trust/Confidence engine (Agent 4), Bazaar listing (Agent
5), and a real Super Admin UI, all three — split into sequential
sub-branches/PRs rather than one giant PR, same reasoning as every prior
sprint's size. Moved out of "Deferred" below since they're no longer just
backlog entries.

- Sprint 5a (Bazaar, Agent 5) — done, see "Done" below.
- Sprint 5b (Trust/Confidence engine, Agent 4) — done, see "Done" below.
  **Real gap carried forward, not closed by this sprint:** nothing reads
  `classifyConfidence()`'s output to actually gate any agent's behavior —
  Reminder always sends, Negotiation's poll always runs its full process
  regardless of any edge's score. The spec is explicit these thresholds
  need validating against real usage before anything depends on them,
  and there's no real usage yet — so this is deliberately data collection
  only, not a claim that auto-act works. Also: `calendarConflictCertainty`
  and `responseReliability` (2 of the 4 confidence factors) have no real
  signal source — they default to neutral 0.5 until Google Calendar
  (post-launch) and Layer 2 relationship tracking exist. See
  `packages/trust-graph/README.md` for the full honest accounting.
- Sprint 5c (real Super Admin UI) — done, see "Done" below. Closes the
  admin-auth gap above and the "Plans" editing UI Sprint 4 never got.

## In progress — Sprint 6 (2026-08-18/19)

Confirmed scope, per Veer's direction: "I want all hosts to have a sign in
page from where they can setup meetings, they can also host a publicly
shareable calendar. Hosts can also import contacts with name and phone
number, they can setup their meetings from this interface." Split into
6a/6b/6c, same sequential-sub-branch reasoning as every prior multi-part
sprint — built in one overnight session, to be reviewed/merged together.

- Sprint 6a (host auth, magic link) — done, see "Done" below. Closes the
  "No host login" real gap below.
- Sprint 6b (contacts + meeting creation) — done, see "Done" below.
  Partially closes "HostAccount isn't wired into the agents" below — a
  host's own dashboard now creates real `SchedulingPoll` rows tied to their
  `HostAccount` (`hostId`), replacing the CLI-only `seedPolls.ts` path for
  this flow specifically. The Reminder agent's `BookingContext` still
  doesn't reference `HostAccount` — that part of the gap stays open.
  **Sending** a created meeting (notifying invitees) still requires the
  Negotiation agent's paid `/agents/negotiate` activation, which the
  dashboard deliberately does not call — still blocked on Intermezzo (see
  "Blocking deploy" above). The meeting detail page says this plainly
  rather than implying the draft went out.
- Sprint 6c (public busy/free calendar) — done, see "Done" below.
- **Voice control** (explicitly future scope, not started): "in future, I
  want this to be an app which is going to be voice controlled and the
  host simply speaks and the app confirms its understanding and sets
  meetings for them." No STT/NLU vendor chosen, no architecture decided —
  tracked here only so it isn't lost, not scoped for any near-term sprint.

## Deferred product scope (deliberate cuts, not forgotten)

- **Google Calendar OAuth + sync — explicitly post-launch** (confirmed
  2026-08-18: "put in the backlog and we deal with that after launch").
  Klendoo's own calendar (`CalendarEvent`) is the source of truth until
  then. Google/Outlook become sync adapters into this same model later,
  not a rebuild. Worth remembering the 2–4 week OAuth approval lag when
  this does get picked up — start the application itself well before the
  code work, since the lead time doesn't compress.
- **Chat UI / negotiation via conversation.** The Development Plan paired
  this with the Negotiation agent; what got built instead is a plain
  poll-link flow, which is lighter and didn't need it.
- **Public standalone booking page** (`klendoo.app/book/{host-slug}`).
- **Real background scheduler.** `closeExpiredPolls()` (Sprint 3) has to be
  triggered by hand (`close-polls` CLI) — nothing in this codebase runs on
  a timer yet. Needs actual deployed infrastructure (cron, scheduled
  workflow, worker service) to run it on, which doesn't exist yet.

## Real gaps surfaced answering "what's left before launch" (2026-08-18)

- ~~**No admin auth at all.**~~ **Closed by Sprint 5c** — `/admin/*` now
  requires a real (if intentionally minimal) signed-cookie session behind
  `ADMIN_PASSWORD`. Single shared password, not per-admin accounts — fine
  for a solo founder, revisit if the team grows.
- ~~**HostAccount isn't wired into the agents yet.**~~ **Partially closed by
  Sprint 6b** — `SchedulingPoll` now has an optional `hostId`, and
  `apps/host-dashboard` creates real host-owned polls through it. Still
  open: the Reminder agent's `BookingContext` has no `HostAccount`
  reference at all, and the CLI `seedPolls.ts` path still writes hostId-less
  rows.
- ~~**No host login.**~~ **Closed by Sprint 6a** — `apps/host-dashboard`
  gives every `HostAccount` a real magic-link sign-in and signed-cookie
  session (`HOST_SESSION_SECRET`, distinct from the admin's).
- **Wallet provisioning isn't triggered on approval.** Per Veer's wallet
  model, every host should get a Klendoo-funded custodial wallet — but
  `approveHost()` doesn't call Intermezzo to create/fund one. Blocked
  partly on Intermezzo's gateway URL (see deploy blockers above) but the
  application-side call is also just not wired up yet.

## Technical debt

- **`git push` hangs from this session, intermittently.** Root cause never
  found (looks like a stalled Git Credential Manager re-auth with no UI to
  answer it here) — every sprint so far has needed at least one manual push
  from Veer's own terminal as a workaround.
- **5 npm audit vulnerabilities** (3 moderate, 1 high, 1 critical) flagged
  on every `npm install` since Sprint 0 — never triaged. Worth a pass to
  see if any are actually exploitable in this codebase's usage or just
  transitive noise.
- **PR hygiene:** Sprint 3 (`sprint-3/poll-finalization`) was pushed but
  never turned into a PR — caught this at the start of Sprint 4. Check for
  this pattern before assuming "pushed" means "on its way to merging."
- ~~**`@types/express` didn't match the actual `express` runtime.**~~
  **Fixed in Sprint 5c** — every service had `express@^4.21.2` paired with
  `@types/express@^5.0.1` since Sprint 1 (a real version mismatch, not
  just staleness: Express 5's types changed route params to
  `string | string[]`, which silently compiled until a route handler
  actually needed a plain `string`). Pinned to `@types/express@^4.17.21`
  everywhere. Worth a quick check that nothing else in the codebase
  quietly relied on the wrong types.

## Done (for reference — what "done" looked like when it landed)

- Sprint 0 — repo skeleton, CI, secret scanning, minimal schema (PR #3)
- Sprint 1 — Reminder agent, real x402-gated endpoint via `@x402/express`,
  Intermezzo integration (PR #4, PR #6)
- Sprint 2 — scheduling poll data model, Negotiation agent draft/activate/
  respond flow, `@klendoo/email` extracted as shared infra (PR #7)
- Sprint 3 — majority computation, poll finalization, reconsideration
  outreach, calendar event write (PR #8)
- Sprint 4 — configurable `Plan`/`HostAccount` model, host registration +
  admin approval, stubbed billing provider (PR #9)
- Sprint 5a — Bazaar listing manifest (Agent 5): shared merchant metadata,
  per-service `/.well-known/x402`, aggregated manifest generator (PR #10)
- Sprint 5b — Trust/Confidence engine (Agent 4): `TrustEdge` schema,
  `@klendoo/trust-graph` (confidence formula, threshold classification),
  usage-tracking wired into Reminder and Negotiation (PR #11)
- Sprint 5c — real Super Admin UI: signed-cookie session auth,
  Registrations/Hosts/Plans pages, plan editing (the interface Sprint 4's
  "configurable... from the superadmin interface" needed) (PR pending)
- Sprint 6a — host authentication: `@klendoo/auth-session` extracted from
  the admin surface's session logic, `MagicLinkToken` model, new
  `apps/host-dashboard` with magic-link login/verify/logout and a
  session-gated dashboard shell (PR pending)
- Sprint 6b — contacts + meeting creation: `Contact` model (name + phone),
  add/import/remove UI, real form-based meeting creation tied to
  `HostAccount` via `SchedulingPoll.hostId`, meeting list/detail pages that
  plainly surface the still-blocked payment-gated activation step
  (PR pending)

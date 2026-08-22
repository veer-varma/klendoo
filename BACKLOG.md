# Backlog

Living document — update this alongside code changes, don't let it drift.
Items move to "Done" with the PR/commit that closed them, never deleted
outright (history of what was cut and why is worth keeping).

## Blocking deploy — launched 2026-08-19

**2026-08-22:** `ADMIN_PASSWORD` was rotated (Veer no longer had the
original Manus-generated value) — this commit exists to trigger the
redeploy that picks up the new secret, since the deploy job only fires on
an actual push to `main`, not a manual workflow re-run.

`klendoo.com`, `staging.klendoo.com`, and `app.klendoo.com` are all live in
production, serving the real app (verified directly: `/plans` returns real
seeded plan data, `app.klendoo.com/login` renders the real magic-link form,
all three have valid TLS). PR #18 merged, the guarded GitHub Actions
workflow deployed it in 2m10s. What's left is real but no longer
launch-blocking:

- ~~**DNS: `app.klendoo.com` has no A record.**~~ **Resolved same night** —
  Manus added the record; confirmed live and serving traffic.
- ~~**Auth header to Intermezzo's gateway was ambiguous.**~~ **Resolved
  same night** — Manus confirmed only `X-Klendoo-API-Key` is correct; the
  gateway creates its own `Authorization: Bearer <JWT>` to Intermezzo
  internally. `intermezzoClient.ts` updated to send only that header
  (was briefly sending both while this was unconfirmed).
- **Legacy `klendoo-web`/`klendoo-db` decommissioning is formally
  gated, not just Claude's own standing refusal to delete a database.**
  Manus's Claude Development Handoff (2026-08-18) makes it an explicit
  rule: "Do not delete, recreate, migrate, or reuse it without an approved
  backup and migration plan." `klendoo-web` is already stopped (approved
  2026-08-18); `klendoo-db`'s volume stays as a preserved recovery asset
  until that separate approval happens. Manus's own read-only inventory
  found every real table already at zero live rows, so nothing of
  substance is actually at risk — but the backup/approval step is Manus's
  rule now, not just a cautious default.
- **Mainnet explicitly not authorized** — reconfirmed in Manus's 2026-08-18
  refresh despite the TestNet gate passing: "Strictly blocked until a
  fresh written authorization is supplied."
- **Note for next session**: a message relayed from Manus on 2026-08-19
  claimed "no open release PR" and "main has neither a root
  docker-compose.yml nor a Dockerfile" — independently re-verified against
  GitHub directly (PR #18's merge, the file's raw content on `main`, and
  the live site itself) and that claim was simply wrong/stale at the time
  it was sent. Worth a heads-up to Veer/Manus so two agents don't build
  conflicting deploy infra in parallel next time — check the actual repo
  state before authoring a second `docker-compose.yml`.

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
- ~~**Real `@x402/avm` bug: `ALGORAND_MAINNET_CAIP2`/`ALGORAND_TESTNET_CAIP2`
  are truncated.**~~ **Found and worked around 2026-08-19**, first time any
  service ever booted against the real GoPlausible facilitator end-to-end
  (every prior test mocked it). Confirmed against the live facilitator's
  own `/supported` response and reproduced in the package's latest
  published version, 2.23.0, so not a stale-lockfile issue: the package's
  own CAIP-2 constants are 32 base64 chars of the genesis hash instead of
  the full 44 (e.g. testnet is missing the trailing `xi9/cOUJOiI=`), so
  `createResourceServer()` hard-fails at startup with
  `RouteConfigurationError: missing_facilitator` — the facilitator never
  has an exact string match for the truncated network id. Worked around in
  `packages/payment-core/src/network.ts` and
  `packages/bazaar-listing/src/buildManifest.ts` by building the CAIP-2
  string from the package's own (correct) `ALGORAND_*_GENESIS_HASH`
  exports instead of trusting its derived constant — `@x402/avm`'s own
  internal normalization already treats both forms as equivalent, so
  nothing else needed to change. Worth reporting upstream.
- ~~**`packages/db/prisma` had no migration history.**~~ **Found and fixed
  2026-08-19**, same first-real-boot discovery — `prisma generate` (client
  codegen) had been run every sprint, but `prisma migrate dev` never had
  been, so `prisma/migrations/` didn't exist and `prisma migrate deploy`
  had nothing to apply against a fresh database. Generated the initial
  migration against a real local Postgres and committed it
  (`packages/db/prisma/migrations/20260819023257_init/`). Any future
  schema change now needs a real `prisma migrate dev` to add a migration
  file, not just an edit to `schema.prisma` — the old habit of "just edit
  the schema, run generate" silently stops working from here.

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
  "configurable... from the superadmin interface" needed) (PR #12)
- Sprint 6a — host authentication: `@klendoo/auth-session` extracted from
  the admin surface's session logic, `MagicLinkToken` model, new
  `apps/host-dashboard` with magic-link login/verify/logout and a
  session-gated dashboard shell (PR #13)
- Sprint 6b — contacts + meeting creation: `Contact` model (name + phone),
  add/import/remove UI, real form-based meeting creation tied to
  `HostAccount` via `SchedulingPoll.hostId`, meeting list/detail pages that
  plainly surface the still-blocked payment-gated activation step
  (PR #14)
- Sprint 6c — public busy/free calendar: `GET /c/:slug` on
  `apps/host-dashboard`, no auth required, shows only busy/free time
  blocks for the next 60 days (no meeting titles or attendee info — per
  Veer's explicit "Busy/free only" answer), 404s for an unapproved or
  unknown slug rather than confirming the business exists (PR #15)
- Deploy infra (2026-08-19) — first real `Dockerfile`/`docker-compose.yml`/
  Traefik config in the repo, `apps/landing` given an actual server (was
  static-generator scripts only, no homepage), initial Prisma migration
  generated, `ci-deploy.yml` extended to render `/opt/klendoo/shared/.env`
  from GitHub Actions secrets — all of which (`DATABASE_URL`,
  `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `HOST_SESSION_SECRET`,
  `KLENDOO_PAYTO_ADDRESS`, `INTERMEZZO_GATEWAY_URL`) were already
  provisioned in GitHub by Manus the same day, so no new secrets needed
  adding for this to be deployable. The new `db` Postgres service bootstraps
  its own credentials by parsing `DATABASE_URL` (host `db`, database
  `klendoo`, per Manus's Klendoo Environment Discovery) instead of a
  second, separately-secreted password. Fully smoke-tested locally
  end-to-end (Docker Desktop, real Postgres, real GoPlausible facilitator)
  before ever touching the VPS — caught and fixed three real bugs this
  way: an unpinned network/volume-naming bug that would have wiped the
  database on every single redeploy, Traefik v3's `Host()` rule no longer
  accepting multiple comma-separated arguments (v2-only syntax), and the
  `@x402/avm` truncated-CAIP2 bug above (independently found and patched
  by Manus in the running Intermezzo container the same day — this PR is
  the durable source-level fix Manus's own notes asked for). (PR pending)

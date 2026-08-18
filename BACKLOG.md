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

## Deferred product scope (deliberate cuts, not forgotten)

- **Google Calendar OAuth + sync.** Deferred per Veer's 2026-08-17
  direction — Klendoo's own calendar (`CalendarEvent`) is the source of
  truth for now. Google/Outlook become sync adapters into this same model
  later, not a rebuild.
- **Trust/Confidence engine (Agent 4).** `packages/trust-graph`,
  confidence scoring, the 0.8/0.5 auto-act/confirm/manual thresholds — none
  of this exists yet. The full three-layer `TrustEdge` model from the
  Trust Graph Spec hasn't been built; host/action identity is still plain
  string fields (`hostName`/`hostEmail`) everywhere.
- **Bazaar listing manifest (Agent 5).** Flagged repeatedly as low-effort
  and independent of everything else — never actually built. Good
  candidate to pick up whenever there's spare capacity.
- **Chat UI / negotiation via conversation.** The Development Plan paired
  this with the Negotiation agent; what got built instead is a plain
  poll-link flow, which is lighter and didn't need it.
- **Public standalone booking page** (`klendoo.app/book/{host-slug}`).
- **Real background scheduler.** `closeExpiredPolls()` (Sprint 3) has to be
  triggered by hand (`close-polls` CLI) — nothing in this codebase runs on
  a timer yet. Needs actual deployed infrastructure (cron, scheduled
  workflow, worker service) to run it on, which doesn't exist yet.
- **Super Admin console** — registrations approval, host/wallet
  management. Currently only exists as a design mockup (the "Klendoo
  Console" artifact), no real backend or UI code.

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

## Done (for reference — what "done" looked like when it landed)

- Sprint 0 — repo skeleton, CI, secret scanning, minimal schema (PR #3)
- Sprint 1 — Reminder agent, real x402-gated endpoint via `@x402/express`,
  Intermezzo integration (PR #4, PR #6)
- Sprint 2 — scheduling poll data model, Negotiation agent draft/activate/
  respond flow, `@klendoo/email` extracted as shared infra (PR #7)
- Sprint 3 — majority computation, poll finalization, reconsideration
  outreach, calendar event write (pushed, PR not yet opened — see above)
- Sprint 4 — configurable `Plan`/`HostAccount` model, host registration +
  admin approval, stubbed billing provider (pushed, PR not yet opened)

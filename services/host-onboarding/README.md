# host-onboarding

Host registration, admin approval, plan management, **and now a real
Super Admin UI** — server-rendered HTML, not the earlier console mockup.
Not one of the five agents from the Development Plan: this is Klendoo's
own account functionality, so there's no x402 payment middleware here at
all.

## The admin UI is real now, at `/admin`

- `/admin` — Registrations queue, Approve/Reject buttons
- `/admin/hosts` — every host, plan, status
- `/admin/plans` — **edit plan name/price/billing interval/active, right
  from the browser.** This is the actual feature behind Veer's Sprint 4
  request ("configurable from the superadmin interface, because we could
  then do discounts etc.") — Sprint 4 built the `Plan` table, this closes
  the loop with somewhere to actually change it.

Protected by a real (if intentionally minimal) session: `/admin/login`
takes a single shared `ADMIN_PASSWORD`, sets an HMAC-signed, HttpOnly
cookie (`admin/session.ts` — hand-rolled, no `express-session` dependency,
same reasoning as `PostmarkClient` being raw `fetch` instead of an SDK).
Single shared password on purpose: this is a solo-founder admin tool, not
a multi-admin system with roles — real per-admin accounts are future work
if the team grows.

## Plans are data, not code

Per Veer's direction (2026-08-17): "these should be configurable from the
superadmin interface, because we could then do discounts etc." — so `Plan`
is a real table (`packages/db`), editable from `/admin/plans` now, not
just creatable via `seedPlans.ts`.

## Flow

1. `POST /register` — a host signs up, referencing a plan by `planKey`.
   Lands as `PENDING`. Nothing is charged yet, even for a paid plan — you
   don't charge someone before confirming they're a real business.
2. Admin approves at `/admin`. For a paid plan, this is also where billing
   starts (`approveHost.ts` calls the `BillingProvider` before marking
   approved — a host on a plan that fails to bill shouldn't end up
   approved with nothing behind it).
3. Or rejects — same page.

## Billing is stubbed, on purpose

No Stripe account or API key exists anywhere in this project yet (checked
against Manus's environment handoff — not there). `StripeBillingProvider`
is built to the same shape Sprint 0's `GoPlausibleFacilitator` used before
real facilitator access existed: it throws a clear "not implemented, needs
STRIPE_SECRET_KEY" error rather than guessing at Stripe's actual API. Free
plans skip billing entirely and approve immediately. See `BACKLOG.md` for
the Stripe-account-provisioning item, and for Veer's note that the actual
payment gateway integration is coming separately.

## What's still not real

- **Wallet balances aren't shown on `/admin/hosts`** — custodial wallet
  provisioning on approval isn't wired up yet (blocked partly on
  Intermezzo's gateway URL, partly just not built — see `BACKLOG.md`).
- **HostAccount still isn't referenced by the other agents** — Reminder
  and Negotiation take plain `hostName`/`hostEmail` strings, not a real
  registered host. Approving someone here doesn't yet let them actually
  use the product as themselves.

## Running it locally

```bash
npm run build --workspace=@klendoo/host-onboarding
npm run seed-plans --workspace=@klendoo/host-onboarding   # once, establishes Starter/Entrepreneur
npm run start --workspace=@klendoo/host-onboarding         # needs DATABASE_URL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET
```

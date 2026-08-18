# host-onboarding

Host registration, admin approval, and plan management — the backend for
the "Registrations" screen in the Super Admin console mockup. Not one of
the five agents from the Development Plan: this is Klendoo's own account
functionality, so there's no x402 payment middleware here at all.

## Plans are data, not code

Per Veer's direction (2026-08-17): "these should be configurable from the
superadmin interface, because we could then do discounts etc." — so `Plan`
is a real table (`packages/db`), not a hardcoded Starter/Entrepreneur
constant. `seedPlans.ts` establishes the two starting rows (Starter: free,
Entrepreneur: $49.99/month) but is meant to be a one-time bootstrap, not
the ongoing source of truth — an admin editing a `Plan` row directly is the
intended path once a real admin UI exists.

## Flow

1. `POST /register` — a host signs up, referencing a plan by `planKey`.
   Lands as `PENDING`. Nothing is charged yet, even for a paid plan — you
   don't charge someone before confirming they're a real business.
2. `POST /admin/hosts/:id/approve` — moves them to `APPROVED`. For a paid
   plan, this is also where billing starts (`approveHost.ts` calls the
   `BillingProvider` before marking approved — a host on a plan that fails
   to bill shouldn't end up approved with nothing behind it).
3. `POST /admin/hosts/:id/reject` — moves them to `REJECTED`.

## Billing is stubbed, on purpose

No Stripe account or API key exists anywhere in this project yet (checked
against Manus's environment handoff — not there). `StripeBillingProvider`
is built to the same shape Sprint 0's `GoPlausibleFacilitator` used before
real facilitator access existed: it throws a clear "not implemented, needs
STRIPE_SECRET_KEY" error rather than guessing at Stripe's actual API. Free
plans skip billing entirely and approve immediately. See `BACKLOG.md` for
the Stripe-account-provisioning item.

## No admin auth yet

`/admin/*` routes have no auth — a real gap, not an oversight, flagged in
`BACKLOG.md`. Fine for local development against the console mockup; not
fine once this is reachable from the internet.

## Running it locally

```bash
npm run build --workspace=@klendoo/host-onboarding
npm run seed-plans --workspace=@klendoo/host-onboarding   # once, establishes Starter/Entrepreneur
npm run start --workspace=@klendoo/host-onboarding         # needs DATABASE_URL
```

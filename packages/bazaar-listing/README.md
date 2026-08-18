# @klendoo/bazaar-listing

Agent 5 (Bazaar), per the Trust Graph Spec §2: **no dedicated service** —
"a listing manifest wrapping Agent 1/2/3's existing priced endpoints, not
new agent logic." This package is that manifest logic, shared so it's
built once instead of copy-pasted into every service.

## What's here

- `merchantInfo.ts` — Klendoo's merchant identity (name, website, logo,
  categories), spread into every paid route's `extensions["x402-merchant"]`
  so it's consistent everywhere, not duplicated per service.
- `buildManifest.ts` — builds the `/.well-known/x402` discovery document.
  Confirmed against GoPlausible's own discovery guide
  (facilitator.goplausible.xyz/guide/discovery) for the exact shape, not
  guessed. Converts a plain decimal USD price (the same units
  `PlatformSetting` already stores) to atomic USDC units via `@x402/core`'s
  real `convertToTokenAmount`, not hand-rolled decimal math.

## Where it's used

Every paid service (`followup-reminder-agent`, `negotiation-agent`) serves
its own single-resource manifest at its own `/.well-known/x402`.
`apps/landing`'s `generate:manifest` script aggregates all of them into
one document — the actual artifact the Trust Graph Spec names
(`packages/bazaar-listing/manifest.json`) — for whichever origin ends up
serving the public domain root once deployment is real.

## What's *not* here

Actual registration with GoPlausible's Bazaar service, if that turns out
to require an explicit step beyond serving a correct `/.well-known/x402`
— can't confirm either way without a live, deployed endpoint to test
against. Worth checking once deployment happens.

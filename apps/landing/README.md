# landing

Marketing site placeholder + a working `/transparency` static page generator.

## Transparency page

Per the Development Plan's Milestone 1 scope ("A `/transparency` page
(static is fine) listing settlement transaction hashes, updated as real
transactions land"):

```bash
npm run build --workspace=@klendoo/landing
npm run generate:transparency --workspace=@klendoo/landing
```

Reads all `SETTLED` `ClientInteraction` rows and writes a static HTML page
to `public/transparency/index.html`. `renderTransparencyPage.ts` is a pure
function (rows → HTML) so it's unit-tested without needing a database;
`generate.ts` is the thin DB-querying wrapper around it.

## Bazaar discovery manifest (Agent 5)

Per the Trust Graph Spec §2: Agent 5 isn't a dedicated service, it's a
listing manifest wrapping the other agents' existing priced endpoints.

```bash
npm run build --workspace=@klendoo/landing
npm run generate:manifest --workspace=@klendoo/landing
```

Aggregates every paid service's resource (Reminder, Negotiation) into one
`/.well-known/x402` document, written to
`public/.well-known/x402`. Needs `KLENDOO_PAYTO_ADDRESS`,
`PUBLIC_BASE_URL`, and a reachable `DATABASE_URL` (for
`PlatformSetting`-driven pricing via `@klendoo/payment-core`).

Each service also serves its own single-resource manifest at its own
`/.well-known/x402` (see their `server.ts`) — this aggregated one is for
whichever origin ends up serving the public domain root once deployment
is real, still unresolved (see `BACKLOG.md`).

## The rest

The full marketing site (chat UI, host dashboard, embeddable booking page)
is later Development Plan scope, not built yet.

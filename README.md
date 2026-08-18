# klendoo

Micropayment-settled scheduling agent network on Algorand, via x402
(GoPlausible facilitator). See `docs/` (once populated) for architecture;
until then, the authoritative planning docs are `Klendoo_Development_Plan.md`,
`Klendoo_Sprint_Plan.md`, `Klendoo_Product_Definition_Trust_Graph_Spec.md`,
and Manus's `Claude Development Handoff — Klendoo.md` (kept alongside this
repo, not committed into it — they're planning material, not source).

## Status

Sprint 0 and Sprint 1's application code are done. **Nothing is deployed
anywhere** — there is no root `docker-compose.yml`, so the guarded deploy
job in `.github/workflows/ci-deploy.yml` stays a no-op on every merge, on
purpose (see "Why nothing is live yet" below).

- `packages/db` — Prisma schema (`ClientInteraction`, `PlatformSetting`)
- `packages/payment-core` — real `@x402/express`/`@x402/avm`/`@x402/core`
  resource-server helpers (`createResourceServer()`), settlement logging,
  and a client for Klendoo's Intermezzo custodial-wallet gateway
  (`payViaIntermezzo()`)
- `services/followup-reminder-agent` — Agent 3, a real x402-gated
  `GET /agents/reminder` endpoint: a caller pays Klendoo to trigger a
  reminder email, settled on Algorand, logged to `ClientInteraction`
- `apps/landing` — `/transparency` static page generator, reading settled
  interactions

## Why nothing is live yet

Three things, in the order they're likely to clear:

1. **Intermezzo isn't fully wired up.** The custodial-wallet service (Vault
   + Intermezzo, per Manus's handoff) is deployed on TestNet, but its
   internal gateway route isn't finalized, and its TestNet wallets have
   ALGO but zero USDC (blocked on a Circle faucet rate limit) — so there's
   been no real end-to-end settlement test yet.
2. **The legacy VPS stack is still unresolved.** `klendoo-web`/`klendoo-db`
   (a separate, older deployment) currently own `klendoo.com` and
   `staging.klendoo.com` — and per Manus's investigation, "staging" isn't
   actually isolated, it's aliased to the same production app. No new
   deploy target exists until that's sorted.
3. **Mainnet is explicitly not authorized** until a real TestNet settlement
   succeeds and there's fresh written sign-off — see Manus's handoff.

## Development

```
npm install
npm run lint
npm run type-check
npm test
```

A pre-commit hook (`scripts/scan-secrets.js` via Husky) blocks commits that
look like they contain a credential; `.github/workflows/secret-scan.yml` runs
gitleaks on every push/PR as a second check. Never commit `.env` — see
`.env.example` for the variable names a local setup needs.

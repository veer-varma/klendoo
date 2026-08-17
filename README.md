# klendoo

Micropayment-settled scheduling agent network on Algorand, via x402
(GoPlausible facilitator). See `docs/` (once populated) for architecture;
until then, the authoritative planning docs are `Klendoo_Development_Plan.md`,
`Klendoo_Sprint_Plan.md`, and `Klendoo_Product_Definition_Trust_Graph_Spec.md`
(kept alongside this repo, not committed into it — they're planning
material, not source).

## Status

Sprint 0 — repo skeleton, CI, `@klendoo/payment-core` settlement SDK skeleton,
and the minimal `ClientInteraction`/`PlatformSetting` schema. No deployable
application yet: there is no root `docker-compose.yml`, so the guarded
deploy job in `.github/workflows/ci-deploy.yml` stays a no-op on merge.

## Structure

```
packages/db/              Prisma schema + client (ClientInteraction, PlatformSetting)
packages/payment-core/    settle() SDK — facilitator abstracted, testnet by default
services/followup-reminder-agent/   Agent 3 — placeholder, logic lands Sprint 1
apps/landing/              marketing site + /transparency — placeholder, Sprint 1
```

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

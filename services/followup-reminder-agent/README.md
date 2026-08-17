# followup-reminder-agent (Agent 3)

Placeholder — this directory exists as of Sprint 0 to hold the repo's shape;
the actual agent (send email via SendGrid/Postmark, call
`@klendoo/payment-core`'s `settle("reminder", …)`) is Sprint 1 scope. See
`Klendoo_Sprint_Plan.md` → "Sprint 1 — First feature launch".

Note: the Sprint Plan assumes SendGrid; the actual provisioned environment
(`Klendoo_Environment_Handoff_FROM_MANUS.md`) set up Postmark instead
(`POSTMARK_SERVER_API_TOKEN`, `POSTMARK_ACCOUNT_PASSWORD` secrets exist,
no SendGrid secret does). Confirm which provider this agent should target
before Sprint 1 implementation starts.

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

The full marketing site (chat UI, host dashboard, embeddable booking page)
is later Development Plan scope, not Sprint 1.

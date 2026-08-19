/**
 * Real marketing homepage — added for the first live deploy (2026-08-19).
 * Same brand tokens as the admin/host surfaces (indigo/purple + mint-teal,
 * per the actual Klendoo logo) so the whole domain reads as one product.
 */
export function renderLandingPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Klendoo — Your time. Negotiated.</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Klendoo coordinates meetings across everyone's calendars and settles the cost per action in USDC on Algorand — no subscriptions, no back-and-forth.">
  <style>
    :root {
      --brand: #5b3fc4; --brand-strong: #4530a0; --brand-soft: #ede9fb;
      --mint: #14a37e; --mint-soft: #dff7ee;
      --ink: #14171f; --ink-soft: #5b6072; --ink-faint: #8992a8;
      --line: #dee1e9; --surface: #ffffff; --ground: #f5f6f8;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: var(--ground); color: var(--ink); }
    header { display: flex; justify-content: space-between; align-items: center; padding: 22px 36px; max-width: 1040px; margin: 0 auto; }
    .wordmark { font-weight: 700; font-size: 19px; }
    .wordmark .mint { color: var(--mint); }
    nav a { color: var(--ink-soft); text-decoration: none; font-size: 14px; margin-left: 22px; }
    nav a.cta { color: #fff; background: var(--brand); padding: 8px 16px; border-radius: 7px; font-weight: 600; }
    main { max-width: 1040px; margin: 0 auto; padding: 0 36px; }
    .hero { padding: 64px 0 56px; text-align: center; }
    .hero h1 { font-size: 40px; line-height: 1.15; margin: 0 0 16px; text-wrap: balance; }
    .hero .accent { color: var(--brand); }
    .hero p { font-size: 17px; color: var(--ink-soft); max-width: 560px; margin: 0 auto 32px; line-height: 1.55; }
    .hero .actions a { display: inline-block; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 0 6px; }
    .hero .primary { background: var(--brand); color: #fff; }
    .hero .secondary { background: var(--surface); color: var(--brand-strong); border: 1px solid var(--line); }
    .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; padding: 8px 0 64px; }
    .card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 24px; }
    .card .eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--mint); margin-bottom: 10px; }
    .card h3 { margin: 0 0 8px; font-size: 17px; }
    .card p { margin: 0; font-size: 14px; color: var(--ink-soft); line-height: 1.55; }
    footer { border-top: 1px solid var(--line); padding: 24px 36px; text-align: center; font-size: 13px; color: var(--ink-faint); }
    footer a { color: var(--ink-faint); }
    @media (max-width: 720px) { .cards { grid-template-columns: 1fr; } .hero h1 { font-size: 30px; } }
  </style>
</head>
<body>
  <header>
    <div class="wordmark">klend<span class="mint">oo</span></div>
    <nav>
      <a href="/transparency">Transparency</a>
      <a href="/register" class="cta">Sign up as a host</a>
    </nav>
  </header>

  <main>
    <section class="hero">
      <h1>Your time. <span class="accent">Negotiated.</span></h1>
      <p>Klendoo's agents coordinate meetings across everyone's calendars, follow up automatically, and settle the cost per action in USDC on Algorand — no subscriptions, no chasing replies.</p>
      <div class="actions">
        <a href="/register" class="primary">Get started</a>
        <a href="/plans" class="secondary">See plans</a>
      </div>
    </section>

    <section class="cards">
      <div class="card">
        <div class="eyebrow">Negotiation agent</div>
        <h3>Coordination that reaches consensus</h3>
        <p>Propose a few times, invite everyone, and let the agent find the slot the majority can make — with a courtesy nudge to anyone who couldn't.</p>
      </div>
      <div class="card">
        <div class="eyebrow">Reminder agent</div>
        <h3>Follow-ups that actually go out</h3>
        <p>No more meetings quietly forgotten. Reminders are sent automatically, and every send is a metered, settled action — not a hidden cost.</p>
      </div>
      <div class="card">
        <div class="eyebrow">Pay per action</div>
        <h3>Micropayments, not subscriptions</h3>
        <p>Every agent action settles instantly over x402 on Algorand. See exactly what ran and what it cost on the <a href="/transparency">transparency page</a>.</p>
      </div>
    </section>
  </main>

  <footer>
    &copy; Klendoo &middot; <a href="/transparency">Transparency</a> &middot; <a href="/.well-known/x402">Agent discovery</a>
  </footer>
</body>
</html>
`;
}

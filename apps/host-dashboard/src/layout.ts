export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type HostNavItem = "dashboard" | "meetings" | "contacts";

export interface HostLayoutInput {
  title: string;
  active: HostNavItem;
  body: string;
  flash?: string;
}

const NAV_ITEMS: { key: HostNavItem; label: string; href: string }[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "meetings", label: "Meetings", href: "/meetings" },
  { key: "contacts", label: "Contacts", href: "/contacts" },
];

/**
 * Shared shell for every signed-in host page — same brand tokens as the
 * admin surface (services/host-onboarding/src/admin/layout.ts), kept as a
 * separate copy rather than a shared package: two small, independently
 * evolving HTML shells didn't clear the bar for extraction the way the
 * session-cookie logic did (real duplicated *logic*, not just similar
 * markup) — see Sprint 6a's package.json description for that reasoning.
 */
export function renderHostLayout(input: HostLayoutInput): string {
  const nav = NAV_ITEMS.map(
    (item) => `
      <a href="${item.href}" class="nav-item${item.key === input.active ? " active" : ""}">${item.label}</a>`,
  ).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Klendoo — ${escapeHtml(input.title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root {
      --brand: #5b3fc4; --brand-strong: #4530a0; --brand-soft: #ede9fb;
      --mint: #14a37e; --mint-soft: #dff7ee;
      --critical: #a23b27; --critical-soft: #fbe9e4;
      --amber: #9c6b14; --amber-soft: #fbf0dc;
      --ink: #14171f; --ink-soft: #5b6072; --ink-faint: #8992a8;
      --line: #dee1e9; --surface: #ffffff; --ground: #f5f6f8;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: var(--ground); color: var(--ink); }
    .shell { display: flex; min-height: 100vh; }
    .sidebar { width: 200px; background: var(--surface); border-right: 1px solid var(--line); padding: 20px 14px; flex-shrink: 0; }
    .wordmark { font-weight: 700; font-size: 18px; margin-bottom: 24px; }
    .wordmark .mint { color: var(--mint); }
    .nav-item { display: block; padding: 8px 10px; border-radius: 7px; color: var(--ink-soft); text-decoration: none; font-size: 14px; margin-bottom: 2px; }
    .nav-item:hover { background: var(--ground); }
    .nav-item.active { background: var(--brand-soft); color: var(--brand-strong); font-weight: 600; }
    main { flex: 1; padding: 30px 36px; max-width: 960px; }
    h1 { font-size: 22px; margin: 0 0 20px; }
    h2 { font-size: 15px; margin: 28px 0 10px; color: var(--ink-soft); }
    table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
    th, td { text-align: left; padding: 10px 14px; font-size: 13.5px; border-bottom: 1px solid var(--line); }
    th { background: var(--ground); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-faint); }
    tr:last-child td { border-bottom: none; }
    .chip { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11.5px; font-weight: 600; }
    .chip-draft { background: var(--amber-soft); color: var(--amber); }
    .chip-open { background: var(--brand-soft); color: var(--brand-strong); }
    .chip-closed, .chip-finalized { background: var(--mint-soft); color: var(--mint); }
    .chip-cancelled { background: var(--critical-soft); color: var(--critical); }
    button, input[type="submit"] { font-family: inherit; font-size: 12.5px; font-weight: 600; padding: 7px 13px; border-radius: 6px; border: 1px solid var(--line); background: var(--surface); cursor: pointer; }
    .primary { background: var(--brand); color: #fff; border-color: var(--brand); }
    .danger { color: var(--critical); border-color: var(--critical-soft); }
    form.inline { display: inline; }
    .flash { padding: 10px 14px; border-radius: 8px; background: var(--brand-soft); color: var(--brand-strong); font-size: 13px; margin-bottom: 16px; }
    .note { padding: 12px 14px; border-radius: 8px; background: var(--amber-soft); color: var(--amber); font-size: 13px; margin: 12px 0; }
    .card { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 18px 20px; margin-bottom: 16px; }
    input[type="text"], input[type="email"], input[type="tel"], input[type="datetime-local"], textarea, select {
      font-family: inherit; padding: 7px 10px; border: 1px solid var(--line); border-radius: 6px; font-size: 13.5px; width: 100%;
    }
    label { display: block; font-size: 12.5px; font-weight: 600; color: var(--ink-soft); margin-bottom: 4px; margin-top: 12px; }
    .row { display: flex; gap: 12px; }
    .row > * { flex: 1; }
    .slot-row, .invitee-row { display: flex; gap: 8px; align-items: flex-end; margin-bottom: 8px; }
    .slot-row > *, .invitee-row > * { flex: 1; }
    .muted { color: var(--ink-faint); font-size: 12.5px; }
    code { background: var(--ground); padding: 2px 6px; border-radius: 4px; font-size: 12.5px; }
    .logout { margin-top: 20px; font-size: 12px; color: var(--ink-faint); }
    .logout a { color: var(--ink-faint); }
    a.link-out { color: var(--brand); }
  </style>
</head>
<body>
  <div class="shell">
    <aside class="sidebar">
      <div class="wordmark">klend<span class="mint">oo</span></div>
      <nav>${nav}</nav>
      <div class="logout"><form method="post" action="/logout"><button type="submit">Sign out</button></form></div>
    </aside>
    <main>
      <h1>${escapeHtml(input.title)}</h1>
      ${input.flash ? `<div class="flash">${escapeHtml(input.flash)}</div>` : ""}
      ${input.body}
    </main>
  </div>
</body>
</html>
`;
}

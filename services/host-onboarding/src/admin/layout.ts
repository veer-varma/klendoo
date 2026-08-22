export type AdminNavItem = "registrations" | "hosts" | "plans";

export interface AdminLayoutInput {
  title: string;
  active: AdminNavItem;
  body: string;
  /** Rendered above the body — used for a success/error banner after a form post. */
  flash?: string;
}

const NAV_ITEMS: { key: AdminNavItem; label: string; href: string }[] = [
  { key: "registrations", label: "Registrations", href: "/admin" },
  { key: "hosts", label: "Hosts", href: "/admin/hosts" },
  { key: "plans", label: "Plans", href: "/admin/plans" },
];

/**
 * Shared shell for every /admin page — real brand colors (indigo/purple +
 * mint-teal, per the actual Klendoo logo, not the placeholder palette the
 * earlier console mockup used before Veer shared the real one). Simpler
 * than that mockup on purpose: this is functional admin software people
 * operate, not a polished artifact — utilitarian treatment, not editorial.
 */
export function renderAdminLayout(input: AdminLayoutInput): string {
  const nav = NAV_ITEMS.map(
    (item) => `
      <a href="${item.href}" class="nav-item${item.key === input.active ? " active" : ""}">${item.label}</a>`,
  ).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Klendoo Admin — ${escapeHtml(input.title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root {
      --brand: #5b3fc4; --brand-strong: #4530a0; --brand-soft: #ede9fb;
      --mint: #14a37e; --mint-soft: #dff7ee;
      --critical: #a23b27; --critical-soft: #fbe9e4;
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
    main { flex: 1; padding: 30px 36px; max-width: 900px; }
    h1 { font-size: 22px; margin: 0 0 20px; }
    table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
    th, td { text-align: left; padding: 10px 14px; font-size: 13.5px; border-bottom: 1px solid var(--line); }
    th { background: var(--ground); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-faint); }
    tr:last-child td { border-bottom: none; }
    .chip { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11.5px; font-weight: 600; }
    .chip-pending { background: #fbf0dc; color: #9c6b14; }
    .chip-approved { background: var(--mint-soft); color: var(--mint); }
    .chip-rejected { background: var(--critical-soft); color: var(--critical); }
    button, input[type="submit"] { font-family: inherit; font-size: 12.5px; font-weight: 600; padding: 5px 11px; border-radius: 6px; border: 1px solid var(--line); background: var(--surface); cursor: pointer; }
    .approve { color: var(--mint); border-color: var(--mint-soft); }
    .reject { color: var(--critical); border-color: var(--critical-soft); }
    form.inline { display: inline; }
    .flash { padding: 10px 14px; border-radius: 8px; background: var(--brand-soft); color: var(--brand-strong); font-size: 13px; margin-bottom: 16px; }
    input[type="text"], input[type="number"], input[type="password"], input[type="email"], select { font-family: inherit; padding: 6px 9px; border: 1px solid var(--line); border-radius: 6px; font-size: 13px; }
    .plan-form { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .card { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 18px 20px; }
    .logout { margin-top: 20px; font-size: 12px; color: var(--ink-faint); }
    .logout a { color: var(--ink-faint); }
  </style>
</head>
<body>
  <div class="shell">
    <aside class="sidebar">
      <div class="wordmark">klend<span class="mint">oo</span> admin</div>
      <nav>${nav}</nav>
      <div class="logout"><form method="post" action="/admin/logout"><button type="submit">Log out</button></form></div>
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

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

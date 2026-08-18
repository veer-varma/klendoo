function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shell(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} — Klendoo</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root { --brand: #5b3fc4; --mint: #14a37e; --ink: #14171f; --ink-soft: #5b6072; --ink-faint: #8992a8; --line: #dee1e9; --surface: #fff; --ground: #f5f6f8; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: var(--ground); color: var(--ink); display: flex; justify-content: center; }
    main { width: 100%; max-width: 560px; padding: 40px 24px; }
    .wordmark { font-weight: 700; font-size: 16px; color: var(--ink-faint); margin-bottom: 6px; }
    .wordmark .mint { color: var(--mint); }
    h1 { font-size: 22px; margin: 0 0 6px; }
    .muted { color: var(--ink-soft); font-size: 13.5px; margin-bottom: 24px; }
    .day { margin-bottom: 18px; }
    .day-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-faint); margin-bottom: 8px; }
    .block { background: var(--surface); border: 1px solid var(--line); border-left: 3px solid var(--brand); border-radius: 8px; padding: 10px 14px; font-size: 13.5px; margin-bottom: 6px; }
    .empty { color: var(--ink-faint); font-size: 13.5px; padding: 20px 0; }
  </style>
</head>
<body>
  <main>
    <div class="wordmark">klend<span class="mint">oo</span></div>
    ${body}
  </main>
</body>
</html>
`;
}

export interface PublicBusyBlock {
  dateLabel: string;
  timeRange: string;
}

export function renderPublicCalendarPage(businessName: string, blocks: PublicBusyBlock[]): string {
  const grouped: Record<string, string[]> = {};
  for (const b of blocks) {
    (grouped[b.dateLabel] ??= []).push(b.timeRange);
  }

  const days = Object.entries(grouped)
    .map(
      ([date, ranges]) => `
      <div class="day">
        <div class="day-label">${escapeHtml(date)}</div>
        ${ranges.map((r) => `<div class="block">Busy · ${escapeHtml(r)}</div>`).join("")}
      </div>`,
    )
    .join("");

  return shell(
    businessName,
    `
    <h1>${escapeHtml(businessName)}</h1>
    <p class="muted">Availability for the next 60 days — busy times only, no meeting details are shown.</p>
    ${blocks.length === 0 ? `<p class="empty">No busy times on record right now.</p>` : days}
  `,
  );
}

export function renderPublicCalendarNotFoundPage(): string {
  return shell(
    "Calendar not found",
    `
    <h1>Calendar not found</h1>
    <p class="muted">This link doesn't match a published Klendoo calendar.</p>
  `,
  );
}

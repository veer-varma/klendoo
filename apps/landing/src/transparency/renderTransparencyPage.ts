import type { SettlementRow } from "./types.js";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Pure rendering function — takes settled rows, produces the static
 * /transparency page. Kept separate from generate.ts (which queries the DB)
 * so it's testable without a database, per Milestone 1's "static is fine".
 */
export function renderTransparencyPage(rows: SettlementRow[]): string {
  const rowsHtml = rows
    .map(
      (r) => `
      <tr>
        <td>${escapeHtml(r.settledAt)}</td>
        <td>${escapeHtml(r.actionType)}</td>
        <td>${escapeHtml(r.amount)} ${escapeHtml(r.currency)}</td>
        <td>${escapeHtml(r.network)}</td>
        <td><code>${escapeHtml(r.txnHash)}</code></td>
      </tr>`,
    )
    .join("");

  const emptyState = rows.length === 0
    ? "<p>No settlements yet. Check back once the first reminder goes out.</p>"
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Klendoo — Transparency</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #ddd; }
    code { font-size: 0.85em; }
  </style>
</head>
<body>
  <h1>Klendoo — Transparency</h1>
  <p>Every settled action, as it happens. ${rows.length} settlement${rows.length === 1 ? "" : "s"} recorded.</p>
  ${emptyState}
  ${rows.length > 0 ? `<table>
    <thead><tr><th>Settled at</th><th>Action</th><th>Amount</th><th>Network</th><th>Transaction</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>` : ""}
</body>
</html>
`;
}

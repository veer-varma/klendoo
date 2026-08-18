import { renderAdminLayout, escapeHtml } from "./layout.js";

export interface HostRow {
  businessName: string;
  email: string;
  status: string;
  planName: string;
  approvedAt: string | null; // pre-formatted, or null
}

function statusChip(status: string): string {
  const cls = status === "PENDING" ? "chip-pending" : status === "APPROVED" ? "chip-approved" : "chip-rejected";
  return `<span class="chip ${cls}">${escapeHtml(status)}</span>`;
}

export function renderHostsPage(hosts: HostRow[]): string {
  const rows = hosts
    .map(
      (h) => `
      <tr>
        <td><strong>${escapeHtml(h.businessName)}</strong></td>
        <td>${escapeHtml(h.email)}</td>
        <td>${escapeHtml(h.planName)}</td>
        <td>${statusChip(h.status)}</td>
        <td>${h.approvedAt ? escapeHtml(h.approvedAt) : "—"}</td>
      </tr>`,
    )
    .join("");

  const body = `
    <p style="color:#8992a8;font-size:13px;margin-top:-8px;">
      Wallet balances aren't shown yet — custodial wallet provisioning on approval isn't wired up
      (blocked on Intermezzo's gateway URL; see BACKLOG.md).
    </p>
    ${
      hosts.length === 0
        ? "<p>No hosts yet.</p>"
        : `<table>
      <thead><tr><th>Business</th><th>Contact</th><th>Plan</th><th>Status</th><th>Approved</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
    }`;

  return renderAdminLayout({ title: "Hosts", active: "hosts", body });
}

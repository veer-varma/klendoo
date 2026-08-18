import { renderAdminLayout, escapeHtml } from "./layout.js";

export interface RegistrationRow {
  id: string;
  businessName: string;
  email: string;
  slug: string;
  status: string;
  planName: string;
  createdAt: string; // pre-formatted
}

function statusChip(status: string): string {
  const cls = status === "PENDING" ? "chip-pending" : status === "APPROVED" ? "chip-approved" : "chip-rejected";
  return `<span class="chip ${cls}">${escapeHtml(status)}</span>`;
}

export function renderRegistrationsPage(hosts: RegistrationRow[], flash?: string): string {
  const rows = hosts
    .map(
      (h) => `
      <tr>
        <td><strong>${escapeHtml(h.businessName)}</strong><br><span style="color:#8992a8;font-size:12px">klendoo.com/${escapeHtml(h.slug)}</span></td>
        <td>${escapeHtml(h.email)}</td>
        <td>${escapeHtml(h.planName)}</td>
        <td>${escapeHtml(h.createdAt)}</td>
        <td>${statusChip(h.status)}</td>
        <td>
          ${
            h.status === "PENDING"
              ? `<form class="inline" method="post" action="/admin/hosts/${h.id}/approve"><button class="approve" type="submit">Approve</button></form>
                 <form class="inline" method="post" action="/admin/hosts/${h.id}/reject"><button class="reject" type="submit">Reject</button></form>`
              : ""
          }
        </td>
      </tr>`,
    )
    .join("");

  const body =
    hosts.length === 0
      ? "<p>No registrations yet.</p>"
      : `<table>
      <thead><tr><th>Business</th><th>Contact</th><th>Plan</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  return renderAdminLayout({ title: "Registrations", active: "registrations", body, flash });
}

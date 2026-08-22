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

export interface InvitablePlan {
  key: string;
  name: string;
}

function statusChip(status: string): string {
  const cls = status === "PENDING" ? "chip-pending" : status === "APPROVED" ? "chip-approved" : "chip-rejected";
  return `<span class="chip ${cls}">${escapeHtml(status)}</span>`;
}

/**
 * Admin-initiated invite (Sprint 7a) — per Veer's direction: "the admin
 * can add emails also and that will send a [sign-in link]." Skips the
 * Pending queue entirely (inviteHost.ts creates the host already
 * APPROVED) since choosing to invite someone directly is itself the
 * vetting step.
 */
function renderInviteForm(plans: InvitablePlan[]): string {
  const planOptions = plans.map((p) => `<option value="${escapeHtml(p.key)}">${escapeHtml(p.name)}</option>`).join("");
  return `
    <div class="card" style="margin-bottom:20px">
      <h2 style="margin-top:0;font-size:15px">Invite a host directly</h2>
      <p style="color:var(--ink-faint,#8992a8);font-size:12.5px;margin-top:-8px">
        Skips the registration queue — the host is approved immediately and gets a sign-in link by email.
      </p>
      <form method="post" action="/admin/hosts/invite" class="plan-form">
        <input type="text" name="businessName" placeholder="Business name" required>
        <input type="email" name="email" placeholder="Email" required>
        <input type="text" name="slug" placeholder="URL slug (e.g. sable-studio)" required>
        <select name="planKey" required>${planOptions}</select>
        <button type="submit" class="approve">Send invite</button>
      </form>
    </div>
  `;
}

export function renderRegistrationsPage(hosts: RegistrationRow[], invitablePlans: InvitablePlan[], flash?: string): string {
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
    renderInviteForm(invitablePlans) +
    (hosts.length === 0
      ? "<p>No registrations yet.</p>"
      : `<table>
      <thead><tr><th>Business</th><th>Contact</th><th>Plan</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`);

  return renderAdminLayout({ title: "Registrations", active: "registrations", body, flash });
}

import { renderHostLayout, escapeHtml } from "./layout.js";

export interface MeetingDetail {
  id: string;
  title: string;
  status: string;
  deadline: string;
  slots: { startTime: string; endTime: string }[];
  invitees: { name: string; email: string; respondedAt: string | null }[];
}

export function renderMeetingDetailPage(meeting: MeetingDetail): string {
  const slotList = meeting.slots
    .map((s) => `<li>${escapeHtml(s.startTime)} – ${escapeHtml(s.endTime)}</li>`)
    .join("");

  const inviteeRows = meeting.invitees
    .map(
      (i) => `
      <tr>
        <td>${escapeHtml(i.name)}</td>
        <td>${escapeHtml(i.email)}</td>
        <td>${i.respondedAt ? escapeHtml(i.respondedAt) : `<span class="muted">Not yet</span>`}</td>
      </tr>`,
    )
    .join("");

  const body = `
    <p><a href="/meetings" class="link-out">← All meetings</a></p>

    ${
      meeting.status === "DRAFT"
        ? `<div class="note">
            This meeting is still a draft — invitees have not been notified.
            Sending invites requires a completed Klendoo payment (the
            Negotiation agent's paid activation step), which isn't live
            yet. Poll ID <code>${meeting.id}</code> is what ops needs to
            activate it once payments are wired up.
          </div>`
        : ""
    }

    <div class="card">
      <span class="chip chip-${meeting.status.toLowerCase()}">${escapeHtml(meeting.status)}</span>
      <p class="muted" style="margin-bottom:0">Response deadline: ${escapeHtml(meeting.deadline)}</p>
    </div>

    <h2>Candidate times</h2>
    <div class="card"><ul style="margin:0;padding-left:18px">${slotList}</ul></div>

    <h2>Invitees (${meeting.invitees.length})</h2>
    <table>
      <thead><tr><th>Name</th><th>Email</th><th>Responded</th></tr></thead>
      <tbody>${inviteeRows}</tbody>
    </table>
  `;

  return renderHostLayout({ title: meeting.title, active: "meetings", body });
}

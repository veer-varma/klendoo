import { renderHostLayout, escapeHtml } from "./layout.js";

export interface MeetingRow {
  id: string;
  title: string;
  status: string;
  deadline: string;
  inviteeCount: number;
}

export function renderMeetingsPage(meetings: MeetingRow[], flash?: string): string {
  const rows = meetings
    .map(
      (m) => `
      <tr>
        <td><a href="/meetings/${m.id}" class="link-out">${escapeHtml(m.title)}</a></td>
        <td><span class="chip chip-${m.status.toLowerCase()}">${escapeHtml(m.status)}</span></td>
        <td>${escapeHtml(m.deadline)}</td>
        <td>${m.inviteeCount}</td>
      </tr>`,
    )
    .join("");

  const body = `
    <p><a href="/meetings/new" class="primary" style="display:inline-block;text-decoration:none;padding:9px 16px;border-radius:7px;background:var(--brand);color:#fff;font-weight:600;font-size:13.5px">+ New meeting</a></p>
    ${
      meetings.length === 0
        ? `<p class="muted">No meetings yet — create your first one.</p>`
        : `<table>
            <thead><tr><th>Title</th><th>Status</th><th>Response deadline</th><th>Invitees</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>`
    }
  `;

  return renderHostLayout({ title: "Meetings", active: "meetings", body, flash });
}

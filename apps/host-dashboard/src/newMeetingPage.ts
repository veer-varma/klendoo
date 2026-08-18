import { renderHostLayout, escapeHtml } from "./layout.js";

export interface ContactOption {
  id: string;
  name: string;
  phone: string;
}

const SLOT_ROWS = 3;
const FREEFORM_INVITEE_ROWS = 4;

export function renderNewMeetingPage(contacts: ContactOption[], flash?: string): string {
  const slotRows = Array.from({ length: SLOT_ROWS })
    .map(
      () => `
      <div class="slot-row">
        <div><label>Start</label><input type="datetime-local" name="slotStart"></div>
        <div><label>End</label><input type="datetime-local" name="slotEnd"></div>
      </div>`,
    )
    .join("");

  const contactRows = contacts
    .map(
      (c) => `
      <div class="invitee-row">
        <div style="flex: 0 0 auto; display:flex; align-items:center; gap:6px; padding-bottom:7px">
          <input type="checkbox" id="contact_${c.id}" name="contactChecked" value="${c.id}">
          <label for="contact_${c.id}" style="margin:0">${escapeHtml(c.name)} <span class="muted">(${escapeHtml(c.phone)})</span></label>
        </div>
        <div><label>Email for ${escapeHtml(c.name)}</label><input type="email" name="contactEmail_${c.id}" placeholder="required if selected"></div>
      </div>`,
    )
    .join("");

  const freeformRows = Array.from({ length: FREEFORM_INVITEE_ROWS })
    .map(
      () => `
      <div class="invitee-row">
        <div><label>Name</label><input type="text" name="inviteeName"></div>
        <div><label>Email</label><input type="email" name="inviteeEmail"></div>
      </div>`,
    )
    .join("");

  const body = `
    <div class="note">
      Creating a meeting only saves a draft — invitees aren't notified yet.
      Sending invites is a paid step (Klendoo's Negotiation agent) that
      requires a completed payment, which isn't live yet. Ops will need to
      activate this draft once that's ready — see the meeting page after
      you create it.
    </div>
    <form method="post" action="/meetings">
      <div class="card">
        <label for="title">Meeting title</label>
        <input type="text" id="title" name="title" placeholder="Quarterly check-in" required>

        <label for="deadline">Response deadline</label>
        <input type="datetime-local" id="deadline" name="deadline" required>
      </div>

      <div class="card">
        <h2 style="margin-top:0">Candidate times</h2>
        <p class="muted">Pick at least one time slot invitees can respond to.</p>
        ${slotRows}
      </div>

      <div class="card">
        <h2 style="margin-top:0">Invitees</h2>
        ${
          contacts.length > 0
            ? `<p class="muted">From your contacts — check anyone to invite and confirm their email:</p>${contactRows}<h2>Or invite someone new</h2>`
            : `<p class="muted">You don't have any saved contacts yet — invite someone directly below, or <a href="/contacts" class="link-out">add contacts first</a>.</p>`
        }
        ${freeformRows}
      </div>

      <button type="submit" class="primary">Save draft</button>
    </form>
  `;

  return renderHostLayout({ title: "New meeting", active: "meetings", body, flash });
}

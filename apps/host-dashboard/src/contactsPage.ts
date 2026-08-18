import { renderHostLayout, escapeHtml } from "./layout.js";

export interface ContactRow {
  id: string;
  name: string;
  phone: string;
}

export function renderContactsPage(contacts: ContactRow[], flash?: string): string {
  const rows = contacts
    .map(
      (c) => `
      <tr>
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.phone)}</td>
        <td>
          <form class="inline" method="post" action="/contacts/${c.id}/delete" onsubmit="return confirm('Remove ${escapeHtml(c.name)}?')">
            <button type="submit" class="danger">Remove</button>
          </form>
        </td>
      </tr>`,
    )
    .join("");

  const body = `
    <div class="card">
      <h2 style="margin-top:0">Add a contact</h2>
      <form method="post" action="/contacts">
        <div class="row">
          <div>
            <label for="name">Name</label>
            <input type="text" id="name" name="name" required>
          </div>
          <div>
            <label for="phone">Phone number</label>
            <input type="tel" id="phone" name="phone" required>
          </div>
        </div>
        <p><button type="submit" class="primary">Save contact</button></p>
      </form>
    </div>

    <div class="card">
      <h2 style="margin-top:0">Import contacts</h2>
      <p class="muted">Paste one contact per line, as <code>Name, Phone</code> — works with a two-column copy/paste from a spreadsheet too.</p>
      <form method="post" action="/contacts/import">
        <textarea name="contacts" rows="5" placeholder="Priya Shah, +1 555-0100&#10;Alex Kim, +1 555-0101" required></textarea>
        <p><button type="submit" class="primary">Import</button></p>
      </form>
    </div>

    <h2>Your contacts (${contacts.length})</h2>
    ${
      contacts.length === 0
        ? `<p class="muted">No contacts yet — add one above or import a list.</p>`
        : `<table>
            <thead><tr><th>Name</th><th>Phone</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>`
    }
  `;

  return renderHostLayout({ title: "Contacts", active: "contacts", body, flash });
}

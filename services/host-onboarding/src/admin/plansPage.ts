import { renderAdminLayout, escapeHtml } from "./layout.js";

export interface PlanRow {
  id: string;
  key: string;
  name: string;
  priceUsd: string;
  billingInterval: string;
  active: boolean;
}

/**
 * The actual UI for what Veer asked for in Sprint 4: "these should be
 * configurable from the superadmin interface, because we could then do
 * discounts etc." Sprint 4 built the Plan table; this is the interface
 * that was missing.
 */
export function renderPlansPage(plans: PlanRow[], flash?: string): string {
  const rows = plans
    .map(
      (p) => `
      <tr>
        <td><strong>${escapeHtml(p.name)}</strong><br><span style="color:#8992a8;font-size:12px">key: ${escapeHtml(p.key)}</span></td>
        <td>
          <form class="plan-form" method="post" action="/admin/plans/${p.id}">
            <input type="text" name="name" value="${escapeHtml(p.name)}" style="width:120px">
            $<input type="number" step="0.01" min="0" name="priceUsd" value="${escapeHtml(p.priceUsd)}" style="width:80px">
            <select name="billingInterval">
              <option value="monthly" ${p.billingInterval === "monthly" ? "selected" : ""}>monthly</option>
              <option value="one_time" ${p.billingInterval === "one_time" ? "selected" : ""}>one_time</option>
            </select>
            <label style="font-size:12.5px;"><input type="checkbox" name="active" ${p.active ? "checked" : ""}> active</label>
            <button type="submit">Save</button>
          </form>
        </td>
      </tr>`,
    )
    .join("");

  const body =
    plans.length === 0
      ? "<p>No plans yet — run <code>npm run seed-plans</code> to establish the starting rows.</p>"
      : `<table>
      <thead><tr><th>Plan</th><th>Edit</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  return renderAdminLayout({ title: "Plans", active: "plans", body, flash });
}

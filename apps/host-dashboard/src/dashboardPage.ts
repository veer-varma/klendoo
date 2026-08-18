import { renderHostLayout } from "./layout.js";

export interface DashboardStats {
  businessName: string;
  upcomingMeetingCount: number;
  contactCount: number;
  publicCalendarUrl: string;
}

export function renderDashboardPage(stats: DashboardStats): string {
  return renderHostLayout({
    title: "Dashboard",
    active: "dashboard",
    body: `
      <p class="muted">Welcome back, ${stats.businessName}.</p>
      <div class="card">
        <h2 style="margin-top:0">Upcoming meetings</h2>
        <p style="font-size:26px;font-weight:700;margin:0">${stats.upcomingMeetingCount}</p>
        <p class="muted"><a href="/meetings" class="link-out">View meetings →</a></p>
      </div>
      <div class="card">
        <h2 style="margin-top:0">Saved contacts</h2>
        <p style="font-size:26px;font-weight:700;margin:0">${stats.contactCount}</p>
        <p class="muted"><a href="/contacts" class="link-out">Manage contacts →</a></p>
      </div>
      <div class="card">
        <h2 style="margin-top:0">Your public calendar</h2>
        <p class="muted">Share this link — it shows only busy/free blocks, never meeting details.</p>
        <p><code>${stats.publicCalendarUrl}</code></p>
      </div>
    `,
  });
}

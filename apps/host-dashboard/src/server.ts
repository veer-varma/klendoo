#!/usr/bin/env node
import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { getDb } from "@klendoo/db";
import { requestMagicLink, verifyMagicLink, InvalidMagicLinkError } from "./magicLink.js";
import {
  SESSION_COOKIE_NAME,
  requireHostSessionSecret,
  createHostSessionCookieValue,
  verifyHostSessionCookieValue,
  parseCookies,
} from "./session.js";
import { renderLoginPage, renderLinkSentPage, renderVerifyFailedPage } from "./loginPage.js";
import { renderDashboardPage } from "./dashboardPage.js";
import { listContacts, addContact, importContacts, deleteContact, InvalidContactError } from "./contacts.js";
import { renderContactsPage } from "./contactsPage.js";
import { createHostMeeting, listHostMeetings, getHostMeeting, InvalidMeetingError } from "./meetings.js";
import { renderMeetingsPage } from "./meetingsPage.js";
import { renderNewMeetingPage } from "./newMeetingPage.js";
import { renderMeetingDetailPage } from "./meetingDetailPage.js";
import { getPublicCalendar } from "./publicCalendar.js";
import { renderPublicCalendarPage, renderPublicCalendarNotFoundPage } from "./publicCalendarPage.js";

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

function formatTimeRange(start: Date, end: Date): string {
  const fmt = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
  return `${fmt(start)} – ${fmt(end)} UTC`;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 16).replace("T", " ");
}

/** express.urlencoded gives a single string for one occurrence of a repeated
 * field name, or an array for two-plus — normalize to always an array. */
function toArray(value: unknown): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? (value as string[]) : [value as string];
}

const PORT = Number(process.env.PORT ?? 4024);

function requirePublicBaseUrl(): string {
  const url = process.env.HOST_DASHBOARD_BASE_URL;
  if (!url) {
    throw new Error(
      "HOST_DASHBOARD_BASE_URL is not set — needed to build the magic-link URL emailed to hosts.",
    );
  }
  return url.replace(/\/$/, "");
}

async function main() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const sessionSecret = requireHostSessionSecret();
  const publicBaseUrl = requirePublicBaseUrl();

  // ---------- auth (public) ----------

  app.get("/login", (_req, res) => {
    res.type("html").send(renderLoginPage());
  });

  app.post("/login", async (req, res) => {
    const { email } = req.body as { email?: string };
    if (typeof email === "string" && email.trim()) {
      try {
        await requestMagicLink(email.trim(), publicBaseUrl);
      } catch (err) {
        // Don't leak whether the send failed vs. the email not matching a
        // host — same page either way. Log server-side so ops can see real
        // failures (e.g. Postmark down) without exposing that to the caller.
        console.error("requestMagicLink failed:", err);
      }
    }
    res.type("html").send(renderLinkSentPage());
  });

  app.get("/login/verify", async (req, res) => {
    const token = req.query.token;
    if (typeof token !== "string") {
      res.type("html").status(400).send(renderVerifyFailedPage("Missing sign-in token."));
      return;
    }
    try {
      const hostId = await verifyMagicLink(token);
      const cookieValue = createHostSessionCookieValue(hostId, sessionSecret);
      res.setHeader(
        "Set-Cookie",
        `${SESSION_COOKIE_NAME}=${cookieValue}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`,
      );
      res.redirect("/dashboard");
    } catch (err) {
      const message = err instanceof InvalidMagicLinkError ? err.message : "Sign-in failed — see server logs.";
      if (!(err instanceof InvalidMagicLinkError)) console.error("verifyMagicLink failed:", err);
      res.type("html").status(401).send(renderVerifyFailedPage(message));
    }
  });

  app.post("/logout", (_req, res) => {
    res.setHeader("Set-Cookie", `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0`);
    res.redirect("/login");
  });

  function requireHostSession(req: Request, res: Response, next: NextFunction) {
    const cookies = parseCookies(req.headers.cookie);
    const hostId = verifyHostSessionCookieValue(cookies[SESSION_COOKIE_NAME], sessionSecret);
    if (hostId) {
      (req as Request & { hostId: string }).hostId = hostId;
      next();
      return;
    }
    res.redirect("/login");
  }

  // ---------- dashboard (protected) ----------

  app.get("/dashboard", requireHostSession, async (req, res) => {
    const hostId = (req as Request & { hostId: string }).hostId;
    const db = getDb();
    const host = await db.hostAccount.findUnique({ where: { id: hostId } });
    if (!host) {
      res.redirect("/login");
      return;
    }

    const [upcomingMeetingCount, contactCount] = await Promise.all([
      db.schedulingPoll.count({ where: { hostId, status: { in: ["DRAFT", "OPEN"] } } }),
      db.contact.count({ where: { hostId } }),
    ]);

    res.type("html").send(
      renderDashboardPage({
        businessName: host.businessName,
        upcomingMeetingCount,
        contactCount,
        // /c/:slug ships in Sprint 6c (same overnight batch) — shown here
        // ahead of that route existing since all three sprints merge together.
        publicCalendarUrl: `${publicBaseUrl}/c/${host.slug}`,
      }),
    );
  });

  // ---------- contacts (protected) ----------

  app.get("/contacts", requireHostSession, async (req, res) => {
    const hostId = (req as Request & { hostId: string }).hostId;
    const contacts = await listContacts(hostId);
    res.type("html").send(
      renderContactsPage(
        contacts.map((c) => ({ id: c.id, name: c.name, phone: c.phone })),
        typeof req.query.flash === "string" ? req.query.flash : undefined,
      ),
    );
  });

  app.post("/contacts", requireHostSession, async (req, res) => {
    const hostId = (req as Request & { hostId: string }).hostId;
    const { name, phone } = req.body as { name?: string; phone?: string };
    try {
      await addContact(hostId, name ?? "", phone ?? "");
      res.redirect("/contacts?flash=" + encodeURIComponent("Contact saved."));
    } catch (err) {
      const message = err instanceof InvalidContactError ? err.message : "Could not save contact — see server logs.";
      if (!(err instanceof InvalidContactError)) console.error("addContact failed:", err);
      res.redirect("/contacts?flash=" + encodeURIComponent(message));
    }
  });

  app.post("/contacts/import", requireHostSession, async (req, res) => {
    const hostId = (req as Request & { hostId: string }).hostId;
    const { contacts: rawText } = req.body as { contacts?: string };
    try {
      const result = await importContacts(hostId, rawText ?? "");
      res.redirect(
        "/contacts?flash=" +
          encodeURIComponent(`Imported ${result.created} contact(s), skipped ${result.skipped}.`),
      );
    } catch (err) {
      console.error("importContacts failed:", err);
      res.redirect("/contacts?flash=" + encodeURIComponent("Import failed — see server logs."));
    }
  });

  app.post("/contacts/:id/delete", requireHostSession, async (req, res) => {
    const hostId = (req as Request & { hostId: string }).hostId;
    await deleteContact(hostId, req.params.id);
    res.redirect("/contacts?flash=" + encodeURIComponent("Contact removed."));
  });

  // ---------- meetings (protected) ----------

  app.get("/meetings", requireHostSession, async (req, res) => {
    const hostId = (req as Request & { hostId: string }).hostId;
    const meetings = await listHostMeetings(hostId);
    res.type("html").send(
      renderMeetingsPage(
        meetings.map((m) => ({
          id: m.id,
          title: m.title,
          status: m.status,
          deadline: formatDate(m.deadline),
          inviteeCount: m.invitees.length,
        })),
        typeof req.query.flash === "string" ? req.query.flash : undefined,
      ),
    );
  });

  app.get("/meetings/new", requireHostSession, async (req, res) => {
    const hostId = (req as Request & { hostId: string }).hostId;
    const contacts = await listContacts(hostId);
    res.type("html").send(
      renderNewMeetingPage(
        contacts.map((c) => ({ id: c.id, name: c.name, phone: c.phone })),
        typeof req.query.flash === "string" ? req.query.flash : undefined,
      ),
    );
  });

  app.post("/meetings", requireHostSession, async (req, res) => {
    const hostId = (req as Request & { hostId: string }).hostId;
    const body = req.body as Record<string, unknown>;

    const slotStarts = toArray(body.slotStart);
    const slotEnds = toArray(body.slotEnd);
    const slots = slotStarts
      .map((startTime, i) => ({ startTime, endTime: slotEnds[i] ?? "" }))
      .filter((s) => s.startTime && s.endTime);

    // Contact names aren't posted back — only their id (checkbox value) and
    // a filled-in email input — so look the names up from the host's saved
    // contacts, keyed by id, rather than trying to line up array indices.
    const contactChecked = toArray(body.contactChecked);
    const contactNameById =
      contactChecked.length > 0
        ? new Map((await listContacts(hostId)).map((c) => [c.id, c.name]))
        : new Map<string, string>();
    const contactInvitees = contactChecked
      .map((contactId) => ({
        name: contactNameById.get(contactId) ?? "",
        email: typeof body[`contactEmail_${contactId}`] === "string" ? (body[`contactEmail_${contactId}`] as string) : "",
      }))
      .filter((i) => i.name && i.email);

    const freeformNames = toArray(body.inviteeName);
    const freeformEmails = toArray(body.inviteeEmail);
    const freeformInvitees = freeformNames
      .map((name, i) => ({ name, email: freeformEmails[i] ?? "" }))
      .filter((i) => i.name && i.email);

    try {
      const poll = await createHostMeeting(hostId, {
        title: typeof body.title === "string" ? body.title : "",
        deadline: typeof body.deadline === "string" ? body.deadline : "",
        slots,
        invitees: [...contactInvitees, ...freeformInvitees],
      });
      res.redirect(`/meetings/${poll.id}?flash=` + encodeURIComponent("Draft meeting created."));
    } catch (err) {
      const message = err instanceof InvalidMeetingError ? err.message : "Could not create meeting — see server logs.";
      if (!(err instanceof InvalidMeetingError)) console.error("createHostMeeting failed:", err);
      res.redirect("/meetings/new?flash=" + encodeURIComponent(message));
    }
  });

  app.get("/meetings/:id", requireHostSession, async (req, res) => {
    const hostId = (req as Request & { hostId: string }).hostId;
    const meeting = await getHostMeeting(hostId, req.params.id);
    if (!meeting) {
      res.status(404).send("Not found.");
      return;
    }
    res.type("html").send(
      renderMeetingDetailPage({
        id: meeting.id,
        title: meeting.title,
        status: meeting.status,
        deadline: formatDate(meeting.deadline),
        slots: meeting.slots.map((s) => ({ startTime: formatDate(s.startTime), endTime: formatDate(s.endTime) })),
        invitees: meeting.invitees.map((i) => ({
          name: i.name,
          email: i.email,
          respondedAt: i.respondedAt ? formatDate(i.respondedAt) : null,
        })),
      }),
    );
  });

  // ---------- public busy/free calendar (no auth) ----------

  app.get("/c/:slug", async (req, res) => {
    const result = await getPublicCalendar(req.params.slug);
    if (!result) {
      res.status(404).type("html").send(renderPublicCalendarNotFoundPage());
      return;
    }
    res.type("html").send(
      renderPublicCalendarPage(
        result.businessName,
        result.busyBlocks.map((b) => ({
          dateLabel: formatDateLabel(b.startTime),
          timeRange: formatTimeRange(b.startTime, b.endTime),
        })),
      ),
    );
  });

  app.get("/", (_req, res) => res.redirect("/dashboard"));

  app.listen(PORT, () => {
    console.log(`Host dashboard listening on :${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start host dashboard:", err);
  process.exitCode = 1;
});

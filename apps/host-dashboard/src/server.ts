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

  app.get("/", (_req, res) => res.redirect("/dashboard"));

  app.listen(PORT, () => {
    console.log(`Host dashboard listening on :${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start host dashboard:", err);
  process.exitCode = 1;
});

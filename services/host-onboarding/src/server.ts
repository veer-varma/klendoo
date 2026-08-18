#!/usr/bin/env node
import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { getDb } from "@klendoo/db";
import { registerHost, PlanNotFoundError } from "./registerHost.js";
import { approveHost, rejectHost, HostNotPendingError } from "./approveHost.js";
import { updatePlan, InvalidPlanPriceError } from "./updatePlan.js";
import {
  SESSION_COOKIE_NAME,
  requireAdminPassword,
  requireSessionSecret,
  verifyPassword,
  createAdminSessionCookieValue,
  verifyAdminSessionCookieValue,
  parseCookies,
} from "./admin/session.js";
import { renderLoginPage } from "./admin/loginPage.js";
import { renderRegistrationsPage } from "./admin/registrationsPage.js";
import { renderHostsPage } from "./admin/hostsPage.js";
import { renderPlansPage } from "./admin/plansPage.js";

const PORT = Number(process.env.PORT ?? 4023);

function formatDate(d: Date | null): string {
  return d ? d.toISOString().slice(0, 16).replace("T", " ") : "";
}

async function main() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const adminPassword = requireAdminPassword();
  const sessionSecret = requireSessionSecret();

  // ---------- public API — not x402-gated, registration/plan-listing is
  // Klendoo's own account functionality, not a paid per-action agent ----------

  app.get("/plans", async (_req, res) => {
    const plans = await getDb().plan.findMany({ where: { active: true } });
    res.json(plans);
  });

  app.post("/register", async (req, res) => {
    try {
      const host = await registerHost(req.body);
      res.status(201).json(host);
    } catch (err) {
      if (err instanceof PlanNotFoundError) {
        res.status(400).json({ ok: false, error: err.message });
        return;
      }
      console.error("Registration failed:", err);
      res.status(500).json({ ok: false, error: (err as Error).message });
    }
  });

  // ---------- admin auth ----------

  app.get("/admin/login", (_req, res) => {
    res.type("html").send(renderLoginPage());
  });

  app.post("/admin/login", (req, res) => {
    const { password } = req.body as { password?: string };
    if (typeof password !== "string" || !verifyPassword(password, adminPassword)) {
      res.type("html").status(401).send(renderLoginPage("Wrong password."));
      return;
    }
    const cookieValue = createAdminSessionCookieValue(sessionSecret);
    res.setHeader(
      "Set-Cookie",
      `${SESSION_COOKIE_NAME}=${cookieValue}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`,
    );
    res.redirect("/admin");
  });

  app.post("/admin/logout", (_req, res) => {
    res.setHeader("Set-Cookie", `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0`);
    res.redirect("/admin/login");
  });

  function requireAdminSession(req: Request, res: Response, next: NextFunction) {
    const cookies = parseCookies(req.headers.cookie);
    if (verifyAdminSessionCookieValue(cookies[SESSION_COOKIE_NAME], sessionSecret)) {
      next();
      return;
    }
    res.redirect("/admin/login");
  }

  // ---------- admin UI — everything below requires a session ----------

  app.get("/admin", requireAdminSession, async (req, res) => {
    const hosts = await getDb().hostAccount.findMany({
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
    res.type("html").send(
      renderRegistrationsPage(
        hosts.map((h) => ({
          id: h.id,
          businessName: h.businessName,
          email: h.email,
          slug: h.slug,
          status: h.status,
          planName: h.plan.name,
          createdAt: formatDate(h.createdAt),
        })),
        typeof req.query.flash === "string" ? req.query.flash : undefined,
      ),
    );
  });

  app.post("/admin/hosts/:id/approve", requireAdminSession, async (req, res) => {
    try {
      await approveHost(req.params.id);
      res.redirect("/admin?flash=" + encodeURIComponent("Host approved."));
    } catch (err) {
      const message = err instanceof HostNotPendingError ? err.message : "Approval failed — see server logs.";
      if (!(err instanceof HostNotPendingError)) console.error("Approval failed:", err);
      res.redirect("/admin?flash=" + encodeURIComponent(message));
    }
  });

  app.post("/admin/hosts/:id/reject", requireAdminSession, async (req, res) => {
    try {
      await rejectHost(req.params.id);
      res.redirect("/admin?flash=" + encodeURIComponent("Host rejected."));
    } catch (err) {
      const message = err instanceof HostNotPendingError ? err.message : "Rejection failed — see server logs.";
      if (!(err instanceof HostNotPendingError)) console.error("Rejection failed:", err);
      res.redirect("/admin?flash=" + encodeURIComponent(message));
    }
  });

  app.get("/admin/hosts", requireAdminSession, async (_req, res) => {
    const hosts = await getDb().hostAccount.findMany({
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
    res.type("html").send(
      renderHostsPage(
        hosts.map((h) => ({
          businessName: h.businessName,
          email: h.email,
          status: h.status,
          planName: h.plan.name,
          approvedAt: formatDate(h.approvedAt),
        })),
      ),
    );
  });

  app.get("/admin/plans", requireAdminSession, async (req, res) => {
    const plans = await getDb().plan.findMany({ orderBy: { createdAt: "asc" } });
    res.type("html").send(
      renderPlansPage(
        plans.map((p) => ({
          id: p.id,
          key: p.key,
          name: p.name,
          priceUsd: p.priceUsd.toString(),
          billingInterval: p.billingInterval,
          active: p.active,
        })),
        typeof req.query.flash === "string" ? req.query.flash : undefined,
      ),
    );
  });

  app.post("/admin/plans/:id", requireAdminSession, async (req, res) => {
    try {
      const { name, priceUsd, billingInterval, active } = req.body as Record<string, string | undefined>;
      await updatePlan(req.params.id, {
        name: name ?? "",
        priceUsd: priceUsd ?? "0",
        billingInterval: billingInterval ?? "monthly",
        active: active === "on" || active === "true",
      });
      res.redirect("/admin/plans?flash=" + encodeURIComponent("Plan updated."));
    } catch (err) {
      const message = err instanceof InvalidPlanPriceError ? err.message : "Update failed — see server logs.";
      if (!(err instanceof InvalidPlanPriceError)) console.error("Plan update failed:", err);
      res.redirect("/admin/plans?flash=" + encodeURIComponent(message));
    }
  });

  app.listen(PORT, () => {
    console.log(`Host onboarding service listening on :${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start host onboarding service:", err);
  process.exitCode = 1;
});

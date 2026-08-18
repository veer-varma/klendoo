#!/usr/bin/env node
import "dotenv/config";
import express from "express";
import { getDb } from "@klendoo/db";
import type { HostStatus } from "@klendoo/db";
import { registerHost, PlanNotFoundError } from "./registerHost.js";
import { approveHost, rejectHost, HostNotPendingError } from "./approveHost.js";

const PORT = Number(process.env.PORT ?? 4023);

async function main() {
  const app = express();
  app.use(express.json());

  // Not x402-gated — registration/approval is Klendoo's own account
  // functionality, not a paid per-action agent (see package.json).

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

  // No admin auth yet — this is a real gap, not an oversight. Anyone who
  // can reach this route can approve/reject a host. Fine for local
  // development against the Super Admin console mockup; not fine once
  // this is reachable from the internet. Flagged in BACKLOG.md.
  const VALID_STATUSES: HostStatus[] = ["PENDING", "APPROVED", "REJECTED"];

  app.get("/admin/hosts", async (req, res) => {
    const raw = req.query.status;
    let status: HostStatus | undefined;
    if (typeof raw === "string") {
      if (!VALID_STATUSES.includes(raw as HostStatus)) {
        res.status(400).json({ ok: false, error: `Invalid status "${raw}".` });
        return;
      }
      status = raw as HostStatus;
    }

    const hosts = await getDb().hostAccount.findMany({
      where: status ? { status } : undefined,
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(hosts);
  });

  app.post("/admin/hosts/:id/approve", async (req, res) => {
    try {
      const host = await approveHost(req.params.id);
      res.json(host);
    } catch (err) {
      if (err instanceof HostNotPendingError) {
        res.status(409).json({ ok: false, error: err.message });
        return;
      }
      console.error("Approval failed:", err);
      res.status(500).json({ ok: false, error: (err as Error).message });
    }
  });

  app.post("/admin/hosts/:id/reject", async (req, res) => {
    try {
      const host = await rejectHost(req.params.id);
      res.json(host);
    } catch (err) {
      if (err instanceof HostNotPendingError) {
        res.status(409).json({ ok: false, error: err.message });
        return;
      }
      console.error("Rejection failed:", err);
      res.status(500).json({ ok: false, error: (err as Error).message });
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

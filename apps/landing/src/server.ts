#!/usr/bin/env node
import "dotenv/config";
import express from "express";
import { getDb } from "@klendoo/db";
import { renderTransparencyPage } from "./transparency/renderTransparencyPage.js";
import type { SettlementRow } from "./transparency/types.js";
import { generateManifest } from "./wellKnown/generate.js";
import { renderLandingPage } from "./landingPage.js";

const PORT = Number(process.env.PORT ?? 4020);

/**
 * The real always-on origin for klendoo.com — added for the first live
 * deploy (2026-08-19). transparency/generate.ts and wellKnown/generate.ts
 * predate this: they were "no server here, just a file an eventual
 * reverse-proxy config can serve" (see wellKnown/generate.ts's own
 * comment) because deployment wasn't real yet. Now that it is, this serves
 * both live rather than from a build-time snapshot — a settlement that
 * lands right after a deploy shouldn't wait for the next rebuild to show
 * up on /transparency. The CLI generate scripts still work standalone
 * (useful for local inspection) and share the same rendering code.
 */
async function main() {
  const app = express();

  app.get("/", (_req, res) => {
    res.type("html").send(renderLandingPage());
  });

  app.get("/transparency", async (_req, res) => {
    try {
      const settled = await getDb().clientInteraction.findMany({
        where: { status: "SETTLED" },
        orderBy: { settledAt: "desc" },
      });
      const rows: SettlementRow[] = settled.map((s) => ({
        interactionId: s.id,
        actionType: s.actionType,
        amount: s.amount.toString(),
        currency: s.currency,
        network: s.network,
        txnHash: s.txnHash ?? "",
        settledAt: s.settledAt?.toISOString() ?? "",
      }));
      res.type("html").send(renderTransparencyPage(rows));
    } catch (err) {
      console.error("Failed to render /transparency:", err);
      res.status(500).send("Transparency page temporarily unavailable.");
    }
  });

  app.get("/.well-known/x402", async (_req, res) => {
    try {
      const manifest = await generateManifest();
      res.type("application/json").send(manifest);
    } catch (err) {
      console.error("Failed to build /.well-known/x402:", err);
      res.status(500).json({ ok: false, error: "Manifest temporarily unavailable." });
    }
  });

  app.listen(PORT, () => {
    console.log(`Landing site listening on :${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start landing site:", err);
  process.exitCode = 1;
});

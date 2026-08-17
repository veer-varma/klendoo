#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDb } from "@klendoo/db";
import { renderTransparencyPage } from "./renderTransparencyPage.js";
import type { SettlementRow } from "./types.js";

const OUTPUT_DIR = path.resolve(process.cwd(), "public/transparency");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "index.html");

async function main() {
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

  const html = renderTransparencyPage(rows);

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, html, "utf8");
  console.log(`Wrote ${rows.length} settlement(s) to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("Failed to generate transparency page:", err);
  process.exitCode = 1;
});

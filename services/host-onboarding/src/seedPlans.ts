#!/usr/bin/env node
import "dotenv/config";
import { getDb } from "@klendoo/db";

/**
 * Seeds the two plans the business plan describes. Idempotent (upsert by
 * key) — safe to run again, e.g. after an admin edits a price and wants to
 * confirm the seed script won't clobber it back. Per Veer's direction
 * (2026-08-17), plans are meant to be edited from a super-admin interface
 * afterward — this script exists to establish the starting rows, not as
 * the ongoing source of truth.
 */
export async function seedDefaultPlans() {
  const db = getDb();

  await db.plan.upsert({
    where: { key: "starter" },
    update: {},
    create: {
      key: "starter",
      name: "Starter",
      priceUsd: "0.00",
      billingInterval: "monthly",
    },
  });

  await db.plan.upsert({
    where: { key: "entrepreneur" },
    update: {},
    create: {
      key: "entrepreneur",
      name: "Entrepreneur",
      priceUsd: "49.99",
      billingInterval: "monthly",
    },
  });
}

async function main() {
  await seedDefaultPlans();
  console.log("Seeded default plans (starter, entrepreneur).");
}

if (process.argv[1]?.endsWith("seedPlans.js")) {
  main().catch((err) => {
    console.error("Seeding plans failed:", err);
    process.exitCode = 1;
  });
}

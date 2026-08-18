import { getDb } from "@klendoo/db";
import type { HostAccount } from "@klendoo/db";
import type { RegisterHostInput } from "./types.js";

export class PlanNotFoundError extends Error {
  constructor(planKey: string) {
    super(`No active plan with key "${planKey}".`);
    this.name = "PlanNotFoundError";
  }
}

/**
 * Registers a host as PENDING — this is the "Registrations" queue from the
 * Super Admin console mockup. Nothing is charged here even for a paid
 * plan; billing happens on approval (approveHost.ts), not at signup, so a
 * host isn't charged before anyone's confirmed they're a real business.
 */
export async function registerHost(input: RegisterHostInput): Promise<HostAccount> {
  const db = getDb();

  const plan = await db.plan.findUnique({ where: { key: input.planKey } });
  if (!plan || !plan.active) {
    throw new PlanNotFoundError(input.planKey);
  }

  return db.hostAccount.create({
    data: {
      businessName: input.businessName,
      email: input.email,
      slug: input.slug,
      planId: plan.id,
    },
  });
}

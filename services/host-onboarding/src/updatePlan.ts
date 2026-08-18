import { getDb } from "@klendoo/db";
import type { Plan } from "@klendoo/db";

export interface UpdatePlanInput {
  name: string;
  priceUsd: string;
  billingInterval: string;
  active: boolean;
}

export class InvalidPlanPriceError extends Error {
  constructor(priceUsd: string) {
    super(`"${priceUsd}" is not a valid non-negative price.`);
    this.name = "InvalidPlanPriceError";
  }
}

/**
 * The actual write path behind the Plans admin page — before this, Plan
 * rows could only be created (seedPlans.ts), never edited, which didn't
 * really satisfy "configurable from the superadmin interface" on its own.
 */
export async function updatePlan(planId: string, input: UpdatePlanInput): Promise<Plan> {
  const price = Number(input.priceUsd);
  if (!Number.isFinite(price) || price < 0) {
    throw new InvalidPlanPriceError(input.priceUsd);
  }

  return getDb().plan.update({
    where: { id: planId },
    data: {
      name: input.name,
      priceUsd: input.priceUsd,
      billingInterval: input.billingInterval,
      active: input.active,
    },
  });
}

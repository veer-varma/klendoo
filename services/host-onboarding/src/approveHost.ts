import { getDb } from "@klendoo/db";
import type { HostAccount } from "@klendoo/db";
import type { BillingProvider } from "./billing/types.js";
import { StripeBillingProvider } from "./billing/stripeBillingProvider.js";

export class HostNotPendingError extends Error {
  constructor(hostId: string, status: string) {
    super(`Host ${hostId} is ${status}, not PENDING — cannot approve.`);
    this.name = "HostNotPendingError";
  }
}

/**
 * Approves a PENDING host. Free plans (priceUsd "0.00") skip billing
 * entirely — only a paid plan starts a subscription. Billing runs before
 * the host is marked APPROVED, not after: a host on a plan billing can't
 * actually charge shouldn't end up approved with no working subscription
 * behind them.
 */
export async function approveHost(
  hostId: string,
  billing: BillingProvider = new StripeBillingProvider(),
): Promise<HostAccount> {
  const db = getDb();

  const host = await db.hostAccount.findUnique({ where: { id: hostId }, include: { plan: true } });
  if (!host) throw new Error(`Host ${hostId} not found.`);
  if (host.status !== "PENDING") throw new HostNotPendingError(hostId, host.status);

  const isFree = Number(host.plan.priceUsd) === 0;

  if (isFree) {
    return db.hostAccount.update({
      where: { id: hostId },
      data: { status: "APPROVED", approvedAt: new Date() },
    });
  }

  const subscription = await billing.startSubscription({
    hostEmail: host.email,
    hostBusinessName: host.businessName,
    planKey: host.plan.key,
    priceUsd: host.plan.priceUsd.toString(),
    billingInterval: host.plan.billingInterval,
  });

  return db.hostAccount.update({
    where: { id: hostId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      stripeCustomerId: subscription.customerId,
      stripeSubscriptionId: subscription.subscriptionId,
    },
  });
}

/** Rejects a PENDING host — no billing involved either way. */
export async function rejectHost(hostId: string): Promise<HostAccount> {
  const db = getDb();
  const host = await db.hostAccount.findUnique({ where: { id: hostId } });
  if (!host) throw new Error(`Host ${hostId} not found.`);
  if (host.status !== "PENDING") throw new HostNotPendingError(hostId, host.status);

  return db.hostAccount.update({ where: { id: hostId }, data: { status: "REJECTED" } });
}

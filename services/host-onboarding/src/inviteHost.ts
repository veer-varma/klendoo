import { getDb } from "@klendoo/db";
import type { HostAccount } from "@klendoo/db";
import { sendMagicLinkEmail } from "@klendoo/host-auth";
import { PlanNotFoundError } from "./registerHost.js";

export interface InviteHostInput {
  businessName: string;
  email: string;
  slug: string;
  planKey: string;
}

/**
 * Thrown when the host account was created successfully but the invite
 * email failed to send (e.g. Postmark down/misconfigured) — distinct from
 * PlanNotFoundError, where nothing was created at all. The distinction
 * matters: without it, an admin sees a generic "Invite failed" that reads
 * as "nothing happened," when actually a real, already-APPROVED host
 * account now exists with no way for that person to know about it. Caught
 * via local smoke-testing (2026-08-22) before this ever reached a real
 * admin — the host row was created and only the email call threw.
 */
export class InviteEmailFailedError extends Error {
  readonly host: HostAccount;

  constructor(host: HostAccount, cause: unknown) {
    super(
      `"${host.businessName}" was created and approved, but the invite email failed to send: ${
        cause instanceof Error ? cause.message : String(cause)
      }. Resend it manually once the issue is fixed.`,
    );
    this.name = "InviteEmailFailedError";
    this.host = host;
  }
}

/**
 * Admin-initiated invite (Sprint 7a) — per Veer's direction (2026-08-22):
 * the admin can add a host's email directly, which sends them a sign-in
 * link (see @klendoo/host-auth's doc comment for why a magic link rather
 * than an emailed temporary password). Unlike self-registration
 * (registerHost.ts), this host is created already APPROVED — the admin
 * choosing to invite them directly is itself the vetting step, so there's
 * no separate Pending review for it to skip.
 */
export async function inviteHost(input: InviteHostInput, hostDashboardBaseUrl: string): Promise<HostAccount> {
  const db = getDb();

  const plan = await db.plan.findUnique({ where: { key: input.planKey } });
  if (!plan || !plan.active) {
    throw new PlanNotFoundError(input.planKey);
  }

  const host = await db.hostAccount.create({
    data: {
      businessName: input.businessName,
      email: input.email,
      slug: input.slug,
      planId: plan.id,
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  try {
    await sendMagicLinkEmail(host, hostDashboardBaseUrl, "invite");
  } catch (err) {
    throw new InviteEmailFailedError(host, err);
  }

  return host;
}

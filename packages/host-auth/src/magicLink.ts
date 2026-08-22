import { getDb } from "@klendoo/db";
import { PostmarkClient } from "@klendoo/email";

/**
 * Extracted from apps/host-dashboard in Sprint 7a once services/
 * host-onboarding needed the same mechanism for admin-initiated invites —
 * same extraction pattern as @klendoo/email and @klendoo/auth-session.
 *
 * TTL shortened from 15 to 10 minutes per Veer's explicit direction
 * (2026-08-22) — applies uniformly to both self-serve sign-in links and
 * admin-invite links ("it also has to expire shortly").
 */
export const MAGIC_LINK_TTL_MS = 10 * 60 * 1000;

interface HostForEmail {
  id: string;
  email: string;
  businessName: string;
}

export type MagicLinkContext = "signin" | "invite";

/**
 * Creates a single-use token for `host` and emails it. Shared by both the
 * self-serve "email me a link" flow (requestMagicLink below) and the
 * admin-invite flow in services/host-onboarding, which already has the
 * host row it just created and doesn't need the lookup/approval check
 * requestMagicLink does.
 */
export async function sendMagicLinkEmail(
  host: HostForEmail,
  publicBaseUrl: string,
  context: MagicLinkContext = "signin",
  postmark: PostmarkClient = new PostmarkClient(),
): Promise<void> {
  const db = getDb();
  const { token } = await db.magicLinkToken.create({
    data: { hostId: host.id, expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MS) },
  });

  const loginUrl = `${publicBaseUrl.replace(/\/$/, "")}/login/verify?token=${token}`;
  const subject = context === "invite" ? "You've been invited to Klendoo" : "Your Klendoo sign-in link";
  const intro =
    context === "invite"
      ? "You've been added as a host on Klendoo. Use this link to sign in and set up your account"
      : "Use this link to sign in to your Klendoo dashboard";

  await postmark.sendEmail({
    to: host.email,
    subject,
    textBody: [
      `Hi ${host.businessName},`,
      "",
      `${intro} — it expires in 10 minutes and only works once:`,
      loginUrl,
      "",
      "If you didn't expect this, you can ignore this email.",
    ].join("\n"),
  });
}

/**
 * Self-serve "enter your email" flow. Deliberately silent about whether
 * the email matched a real, approved host — the caller always shows the
 * same "check your email" response either way, so this can't be used to
 * enumerate registered businesses.
 */
export async function requestMagicLink(
  email: string,
  publicBaseUrl: string,
  postmark: PostmarkClient = new PostmarkClient(),
): Promise<void> {
  const host = await getDb().hostAccount.findUnique({ where: { email } });

  // Only APPROVED hosts can sign in — PENDING hosts haven't been vetted
  // yet, and a REJECTED host shouldn't be handed a working dashboard link.
  if (!host || host.status !== "APPROVED") {
    return;
  }

  await sendMagicLinkEmail(host, publicBaseUrl, "signin", postmark);
}

export class InvalidMagicLinkError extends Error {
  constructor() {
    super("This sign-in link is invalid, already used, or has expired.");
    this.name = "InvalidMagicLinkError";
  }
}

/**
 * Redeems a token: must exist, be unused, and be unexpired. Marks it used
 * in the same call so a second attempt with the same link (e.g. an email
 * link-scanner, or the host clicking twice) fails instead of silently
 * granting a second session.
 */
export async function verifyMagicLink(token: string): Promise<string> {
  const db = getDb();
  const record = await db.magicLinkToken.findUnique({ where: { token } });

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    throw new InvalidMagicLinkError();
  }

  await db.magicLinkToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record.hostId;
}

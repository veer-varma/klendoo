import { getDb } from "@klendoo/db";
import { PostmarkClient } from "@klendoo/email";

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes — short-lived since it's emailed in the clear

/**
 * Creates a single-use login token for a host and emails it as a link.
 * Deliberately silent about whether the email matched a real, approved
 * host — the caller (server.ts) always shows the same "check your email"
 * response either way, so this can't be used to enumerate registered
 * businesses. Returns nothing; success/failure of the *lookup* isn't the
 * caller's business, only whether the send itself errored.
 */
export async function requestMagicLink(
  email: string,
  publicBaseUrl: string,
  postmark: PostmarkClient = new PostmarkClient(),
): Promise<void> {
  const db = getDb();
  const host = await db.hostAccount.findUnique({ where: { email } });

  // Only APPROVED hosts can sign in — PENDING hosts haven't been vetted yet,
  // and a REJECTED host shouldn't be handed a working dashboard link.
  if (!host || host.status !== "APPROVED") {
    return;
  }

  const { token } = await db.magicLinkToken.create({
    data: {
      hostId: host.id,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const loginUrl = `${publicBaseUrl.replace(/\/$/, "")}/login/verify?token=${token}`;

  await postmark.sendEmail({
    to: host.email,
    subject: "Your Klendoo sign-in link",
    textBody: [
      `Hi ${host.businessName},`,
      "",
      `Use this link to sign in to your Klendoo dashboard — it expires in 15 minutes and only works once:`,
      loginUrl,
      "",
      "If you didn't request this, you can ignore this email.",
    ].join("\n"),
  });
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

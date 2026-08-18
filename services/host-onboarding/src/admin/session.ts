import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal signed-cookie session — no express-session, no new dependency,
 * matching this codebase's existing preference for hand-rolled infra over
 * pulling in a library for something this small (see PostmarkClient: raw
 * fetch, not the Postmark SDK).
 *
 * Single shared admin password on purpose — this is a solo-founder admin
 * tool, not a multi-admin system with roles. Real per-admin accounts are
 * future work if the team grows (see BACKLOG.md); this closes the actual
 * launch blocker (zero auth on /admin/*) without over-building ahead of
 * real need.
 */

export const SESSION_COOKIE_NAME = "klendoo_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function requireAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD is not set — required to protect /admin routes.");
  }
  return password;
}

export function requireSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set — required to sign admin session cookies.");
  }
  return secret;
}

/** Timing-safe against the real admin password — a login form is exactly
 * the kind of comparison naive `===` leaks timing information on. */
export function verifyPassword(candidate: string, expected: string): boolean {
  const candidateBuf = Buffer.from(candidate);
  const expectedBuf = Buffer.from(expected);
  if (candidateBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(candidateBuf, expectedBuf);
}

export function createSessionCookieValue(secret: string, now: number = Date.now()): string {
  const payload = JSON.stringify({ exp: now + SESSION_TTL_MS });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

export function verifySessionCookieValue(
  value: string | undefined,
  secret: string,
  now: number = Date.now(),
): boolean {
  if (!value) return false;
  const [encoded, sig] = value.split(".");
  if (!encoded || !sig) return false;

  const expectedSig = sign(encoded, secret);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as { exp?: unknown };
    return typeof payload.exp === "number" && payload.exp > now;
  } catch {
    return false;
  }
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

import {
  timingSafeStringEqual,
  createSessionCookieValue,
  verifySessionCookieValue,
  parseCookies,
} from "@klendoo/auth-session";

/**
 * Single shared admin password on purpose — this is a solo-founder admin
 * tool, not a multi-admin system with roles. Real per-admin accounts are
 * future work if the team grows (see BACKLOG.md); this closes the actual
 * launch blocker (zero auth on /admin/*) without over-building ahead of
 * real need.
 */

export const SESSION_COOKIE_NAME = "klendoo_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

interface AdminSessionPayload {
  admin: true;
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

export function verifyPassword(candidate: string, expected: string): boolean {
  return timingSafeStringEqual(candidate, expected);
}

export function createAdminSessionCookieValue(secret: string, now?: number): string {
  return createSessionCookieValue<AdminSessionPayload>({ admin: true }, secret, SESSION_TTL_MS, now);
}

export function verifyAdminSessionCookieValue(value: string | undefined, secret: string, now?: number): boolean {
  return verifySessionCookieValue<AdminSessionPayload>(value, secret, now) !== null;
}

export { parseCookies };

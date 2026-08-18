import {
  createSessionCookieValue,
  verifySessionCookieValue,
  parseCookies,
} from "@klendoo/auth-session";

/**
 * Host-facing session cookie — same signed-cookie mechanism as the admin
 * surface (services/host-onboarding/src/admin/session.ts), just a different
 * payload shape and secret. Kept as its own thin wrapper rather than reusing
 * the admin one directly, since "admin" and "hostId" are different payload
 * shapes and mixing them up would let one cookie be replayed as the other.
 */

export const SESSION_COOKIE_NAME = "klendoo_host_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — hosts shouldn't have to re-request a link every session

export interface HostSessionPayload {
  hostId: string;
}

export function requireHostSessionSecret(): string {
  const secret = process.env.HOST_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "HOST_SESSION_SECRET is not set — this signs host login cookies and must be a real secret, distinct from ADMIN_SESSION_SECRET.",
    );
  }
  return secret;
}

export function createHostSessionCookieValue(hostId: string, secret: string, now?: number): string {
  return createSessionCookieValue<HostSessionPayload>({ hostId }, secret, SESSION_TTL_MS, now);
}

/** Returns the hostId if the cookie is valid, otherwise null. */
export function verifyHostSessionCookieValue(
  value: string | undefined,
  secret: string,
  now?: number,
): string | null {
  const payload = verifySessionCookieValue<HostSessionPayload>(value, secret, now);
  return payload?.hostId ?? null;
}

export { parseCookies };

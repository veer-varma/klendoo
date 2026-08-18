import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal signed-cookie session — no express-session, no new dependency,
 * matching this codebase's existing preference for hand-rolled infra over
 * pulling in a library for something this small (see PostmarkClient: raw
 * fetch, not the Postmark SDK). Generic over what's stored in the payload
 * and the cookie's own name/TTL, so both the admin surface (single shared
 * password) and the host surface (magic-link) use the same primitive
 * without either depending on the other.
 */

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Timing-safe equality for two strings of possibly-different length —
 * used for both password checks and token comparisons. */
export function timingSafeStringEqual(candidate: string, expected: string): boolean {
  const candidateBuf = Buffer.from(candidate);
  const expectedBuf = Buffer.from(expected);
  if (candidateBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(candidateBuf, expectedBuf);
}

export function createSessionCookieValue<T extends object>(
  payload: T,
  secret: string,
  ttlMs: number,
  now: number = Date.now(),
): string {
  const encoded = Buffer.from(JSON.stringify({ ...payload, exp: now + ttlMs })).toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

/** Returns the decoded payload if the cookie is validly signed and
 * unexpired, or null otherwise — never throws on malformed input. */
export function verifySessionCookieValue<T extends object>(
  value: string | undefined,
  secret: string,
  now: number = Date.now(),
): T | null {
  if (!value) return null;
  const [encoded, sig] = value.split(".");
  if (!encoded || !sig) return null;
  if (!timingSafeStringEqual(sig, sign(encoded, secret))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as T & { exp?: unknown };
    if (typeof payload.exp !== "number" || payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
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

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Password hashing for host accounts (Sprint 7a). Node's built-in scrypt
 * rather than adding a bcrypt/argon2 dependency — same reasoning as
 * @klendoo/auth-session's hand-rolled HMAC session cookies: a real,
 * standard primitive already in Node core, no new dependency needed.
 *
 * Stored format is `<salt-hex>:<derived-key-hex>` — a random salt per
 * password (never reused), so two hosts with the same password still get
 * different stored hashes.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a password against a stored hash. Timing-safe comparison so a
 * mismatch doesn't leak how many bytes matched via response timing —
 * same discipline as auth-session's cookie signature check.
 */
export async function verifyPasswordHash(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;

  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const storedBuffer = Buffer.from(hashHex, "hex");
  if (storedBuffer.length !== derivedKey.length) return false;

  return timingSafeEqual(derivedKey, storedBuffer);
}

export class WeakPasswordError extends Error {
  constructor() {
    super(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    this.name = "WeakPasswordError";
  }
}

/** Minimal length-only floor for now — worth revisiting (breach-list
 * checks, entropy estimation) once there's real usage to justify it. */
export function assertPasswordStrength(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new WeakPasswordError();
  }
}

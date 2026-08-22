import { getDb } from "@klendoo/db";
import { hashPassword, verifyPasswordHash, assertPasswordStrength } from "@klendoo/host-auth";

export class PasswordMismatchError extends Error {
  constructor() {
    super("Passwords don't match.");
    this.name = "PasswordMismatchError";
  }
}

/**
 * Sets (or resets) a host's password. Used for the mandatory first-time
 * setup after a magic-link sign-in (Sprint 7a — Veer's direction: "most
 * users will login with their password after the first magic link
 * interface"). No "confirm your current password" step here on purpose:
 * reaching this function already requires a valid host session (via
 * either magic-link or password), which is the actual authorization
 * check — there's no separate credential to re-confirm.
 */
export async function setHostPassword(hostId: string, password: string, confirmPassword: string): Promise<void> {
  if (password !== confirmPassword) {
    throw new PasswordMismatchError();
  }
  assertPasswordStrength(password); // throws WeakPasswordError
  const passwordHash = await hashPassword(password);
  await getDb().hostAccount.update({ where: { id: hostId }, data: { passwordHash } });
}

/**
 * Password-based login. Same generic-failure discipline as
 * requestMagicLink: an unknown email, a non-approved host, a host who
 * hasn't set a password yet, and a plain wrong password are all
 * indistinguishable from the caller's side — none of them should leak
 * which part failed.
 */
export async function verifyHostPassword(email: string, password: string): Promise<string | null> {
  const host = await getDb().hostAccount.findUnique({ where: { email } });
  if (!host || host.status !== "APPROVED" || !host.passwordHash) {
    return null;
  }
  const ok = await verifyPasswordHash(password, host.passwordHash);
  return ok ? host.id : null;
}

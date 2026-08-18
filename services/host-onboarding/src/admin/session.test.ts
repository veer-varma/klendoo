import { describe, expect, it } from "vitest";
import {
  verifyPassword,
  createAdminSessionCookieValue,
  verifyAdminSessionCookieValue,
} from "./session.js";

// Only the admin-specific wrapper behavior is tested here — the underlying
// sign/verify/expiry logic is @klendoo/auth-session's own test suite now
// that it's shared, not duplicated.

describe("verifyPassword", () => {
  it("returns true for a matching password", () => {
    expect(verifyPassword("correct-horse", "correct-horse")).toBe(true);
  });

  it("returns false for a wrong password", () => {
    expect(verifyPassword("wrong", "correct-horse")).toBe(false);
  });
});

describe("admin session cookie", () => {
  const secret = "test-secret";

  it("verifies a cookie it just created", () => {
    const value = createAdminSessionCookieValue(secret);
    expect(verifyAdminSessionCookieValue(value, secret)).toBe(true);
  });

  it("rejects a cookie signed with a different secret", () => {
    const value = createAdminSessionCookieValue("other-secret");
    expect(verifyAdminSessionCookieValue(value, secret)).toBe(false);
  });

  it("rejects an expired session", () => {
    const issuedWellOverTtlAgo = Date.now() - 13 * 60 * 60 * 1000; // TTL is 12h
    const value = createAdminSessionCookieValue(secret, issuedWellOverTtlAgo);
    expect(verifyAdminSessionCookieValue(value, secret, Date.now())).toBe(false);
  });
});

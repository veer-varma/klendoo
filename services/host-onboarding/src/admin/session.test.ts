import { describe, expect, it } from "vitest";
import {
  verifyPassword,
  createSessionCookieValue,
  verifySessionCookieValue,
  parseCookies,
} from "./session.js";

describe("verifyPassword", () => {
  it("returns true for a matching password", () => {
    expect(verifyPassword("correct-horse", "correct-horse")).toBe(true);
  });

  it("returns false for a wrong password", () => {
    expect(verifyPassword("wrong", "correct-horse")).toBe(false);
  });

  it("returns false rather than throwing when lengths differ", () => {
    expect(verifyPassword("short", "a-much-longer-password")).toBe(false);
  });
});

describe("session cookie sign/verify", () => {
  const secret = "test-secret";

  it("verifies a cookie it just signed", () => {
    const value = createSessionCookieValue(secret);
    expect(verifySessionCookieValue(value, secret)).toBe(true);
  });

  it("rejects a cookie signed with a different secret", () => {
    const value = createSessionCookieValue("other-secret");
    expect(verifySessionCookieValue(value, secret)).toBe(false);
  });

  it("rejects a tampered payload even with a valid-looking signature", () => {
    const value = createSessionCookieValue(secret);
    const [, sig] = value.split(".");
    const tampered = `${Buffer.from(JSON.stringify({ exp: Date.now() + 999999999 })).toString("base64url")}.${sig}`;
    expect(verifySessionCookieValue(tampered, secret)).toBe(false);
  });

  it("rejects an expired session", () => {
    // TTL is 12 hours — "issued" further back than that to actually expire it,
    // not just any time in the past.
    const issuedWellOverTtlAgo = Date.now() - 13 * 60 * 60 * 1000;
    const value = createSessionCookieValue(secret, issuedWellOverTtlAgo);
    expect(verifySessionCookieValue(value, secret, Date.now())).toBe(false);
  });

  it("accepts a session issued recently, well within the TTL", () => {
    const issuedRecently = Date.now() - 5 * 60 * 1000; // 5 minutes ago
    const value = createSessionCookieValue(secret, issuedRecently);
    expect(verifySessionCookieValue(value, secret, Date.now())).toBe(true);
  });

  it("rejects undefined/empty/malformed cookie values", () => {
    expect(verifySessionCookieValue(undefined, secret)).toBe(false);
    expect(verifySessionCookieValue("", secret)).toBe(false);
    expect(verifySessionCookieValue("not-a-valid-cookie", secret)).toBe(false);
  });
});

describe("parseCookies", () => {
  it("parses a standard Cookie header into a map", () => {
    expect(parseCookies("a=1; b=2; c=hello%20world")).toEqual({ a: "1", b: "2", c: "hello world" });
  });

  it("returns an empty object for an undefined header", () => {
    expect(parseCookies(undefined)).toEqual({});
  });
});

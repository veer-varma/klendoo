import { describe, expect, it } from "vitest";
import {
  timingSafeStringEqual,
  createSessionCookieValue,
  verifySessionCookieValue,
  parseCookies,
} from "./session.js";

describe("timingSafeStringEqual", () => {
  it("returns true for matching strings", () => {
    expect(timingSafeStringEqual("correct-horse", "correct-horse")).toBe(true);
  });

  it("returns false for a mismatch", () => {
    expect(timingSafeStringEqual("wrong", "correct-horse")).toBe(false);
  });

  it("returns false rather than throwing when lengths differ", () => {
    expect(timingSafeStringEqual("short", "a-much-longer-value")).toBe(false);
  });
});

describe("session cookie sign/verify", () => {
  const secret = "test-secret";
  const TTL = 12 * 60 * 60 * 1000; // 12 hours, arbitrary for these tests

  it("round-trips an arbitrary payload", () => {
    const value = createSessionCookieValue({ hostId: "host-1", kind: "host" }, secret, TTL);
    const payload = verifySessionCookieValue<{ hostId: string; kind: string }>(value, secret);
    expect(payload).toMatchObject({ hostId: "host-1", kind: "host" });
  });

  it("rejects a cookie signed with a different secret", () => {
    const value = createSessionCookieValue({ a: 1 }, "other-secret", TTL);
    expect(verifySessionCookieValue(value, secret)).toBeNull();
  });

  it("rejects a tampered payload even with a structurally valid signature format", () => {
    const value = createSessionCookieValue({ a: 1 }, secret, TTL);
    const [, sig] = value.split(".");
    const tamperedEncoded = Buffer.from(JSON.stringify({ a: 999, exp: Date.now() + TTL })).toString("base64url");
    expect(verifySessionCookieValue(`${tamperedEncoded}.${sig}`, secret)).toBeNull();
  });

  it("rejects an expired session", () => {
    const issuedWellOverTtlAgo = Date.now() - (TTL + 60 * 60 * 1000);
    const value = createSessionCookieValue({ a: 1 }, secret, TTL, issuedWellOverTtlAgo);
    expect(verifySessionCookieValue(value, secret, Date.now())).toBeNull();
  });

  it("accepts a session issued recently, well within the TTL", () => {
    const issuedRecently = Date.now() - 5 * 60 * 1000;
    const value = createSessionCookieValue({ a: 1 }, secret, TTL, issuedRecently);
    expect(verifySessionCookieValue(value, secret, Date.now())).not.toBeNull();
  });

  it("rejects undefined/empty/malformed cookie values", () => {
    expect(verifySessionCookieValue(undefined, secret)).toBeNull();
    expect(verifySessionCookieValue("", secret)).toBeNull();
    expect(verifySessionCookieValue("not-a-valid-cookie", secret)).toBeNull();
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

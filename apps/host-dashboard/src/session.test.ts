import { describe, expect, it } from "vitest";
import {
  createHostSessionCookieValue,
  verifyHostSessionCookieValue,
} from "./session.js";

describe("host session cookie", () => {
  const secret = "test-secret";

  it("round-trips a hostId through a signed cookie", () => {
    const value = createHostSessionCookieValue("host-123", secret);
    expect(verifyHostSessionCookieValue(value, secret)).toBe("host-123");
  });

  it("rejects a cookie signed with a different secret", () => {
    const value = createHostSessionCookieValue("host-123", "other-secret");
    expect(verifyHostSessionCookieValue(value, secret)).toBeNull();
  });

  it("rejects an expired session (TTL is 30 days)", () => {
    const issuedWellOverTtlAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
    const value = createHostSessionCookieValue("host-123", secret, issuedWellOverTtlAgo);
    expect(verifyHostSessionCookieValue(value, secret, Date.now())).toBeNull();
  });

  it("accepts a session still within its TTL", () => {
    const issuedRecently = Date.now() - 60 * 1000;
    const value = createHostSessionCookieValue("host-123", secret, issuedRecently);
    expect(verifyHostSessionCookieValue(value, secret, Date.now())).toBe("host-123");
  });

  it("returns null for a missing cookie", () => {
    expect(verifyHostSessionCookieValue(undefined, secret)).toBeNull();
  });
});

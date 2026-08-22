import { describe, expect, it } from "vitest";
import { hashPassword, verifyPasswordHash, assertPasswordStrength, WeakPasswordError } from "./password.js";

describe("hashPassword / verifyPasswordHash", () => {
  it("verifies a password against its own hash", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(await verifyPasswordHash("correct-horse-battery-staple", hash)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(await verifyPasswordHash("wrong-password", hash)).toBe(false);
  });

  it("produces a different hash each time (random salt)", async () => {
    const hashA = await hashPassword("same-password");
    const hashB = await hashPassword("same-password");
    expect(hashA).not.toBe(hashB);
    expect(await verifyPasswordHash("same-password", hashA)).toBe(true);
    expect(await verifyPasswordHash("same-password", hashB)).toBe(true);
  });

  it("rejects a malformed stored hash instead of throwing", async () => {
    expect(await verifyPasswordHash("anything", "not-a-real-hash")).toBe(false);
  });
});

describe("assertPasswordStrength", () => {
  it("accepts a password at least 8 characters long", () => {
    expect(() => assertPasswordStrength("12345678")).not.toThrow();
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(() => assertPasswordStrength("short")).toThrow(WeakPasswordError);
  });
});

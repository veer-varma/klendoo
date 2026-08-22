import { describe, expect, it, vi, beforeEach } from "vitest";

interface HostRow {
  id: string;
  email: string;
  status: string;
  passwordHash: string | null;
}

const hosts = new Map<string, HostRow>([
  ["host-1", { id: "host-1", email: "approved@example.com", status: "APPROVED", passwordHash: null }],
  ["host-2", { id: "host-2", email: "pending@example.com", status: "PENDING", passwordHash: null }],
]);
const hostsByEmail = () => new Map([...hosts.values()].map((h) => [h.email, h]));

vi.mock("@klendoo/db", () => ({
  getDb: () => ({
    hostAccount: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id) return hosts.get(where.id) ?? null;
        if (where.email) return hostsByEmail().get(where.email) ?? null;
        return null;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: { passwordHash: string } }) => {
        const host = hosts.get(where.id);
        if (host) host.passwordHash = data.passwordHash;
        return host;
      }),
    },
  }),
}));

const { setHostPassword, verifyHostPassword, PasswordMismatchError } = await import("./hostPassword.js");
const { WeakPasswordError } = await import("@klendoo/host-auth");

beforeEach(() => {
  hosts.set("host-1", { id: "host-1", email: "approved@example.com", status: "APPROVED", passwordHash: null });
  hosts.set("host-2", { id: "host-2", email: "pending@example.com", status: "PENDING", passwordHash: null });
});

describe("setHostPassword", () => {
  it("hashes and stores a matching, strong password", async () => {
    await setHostPassword("host-1", "correct-horse-battery", "correct-horse-battery");
    expect(hosts.get("host-1")!.passwordHash).not.toBeNull();
    expect(hosts.get("host-1")!.passwordHash).not.toBe("correct-horse-battery"); // never stored raw
  });

  it("rejects mismatched password/confirmation", async () => {
    await expect(setHostPassword("host-1", "password-one", "password-two")).rejects.toThrow(PasswordMismatchError);
  });

  it("rejects a weak (too-short) password", async () => {
    await expect(setHostPassword("host-1", "short", "short")).rejects.toThrow(WeakPasswordError);
  });
});

describe("verifyHostPassword", () => {
  it("returns the hostId for the correct password on an approved host with a set password", async () => {
    await setHostPassword("host-1", "correct-horse-battery", "correct-horse-battery");
    const hostId = await verifyHostPassword("approved@example.com", "correct-horse-battery");
    expect(hostId).toBe("host-1");
  });

  it("returns null for the wrong password", async () => {
    await setHostPassword("host-1", "correct-horse-battery", "correct-horse-battery");
    expect(await verifyHostPassword("approved@example.com", "wrong-password")).toBeNull();
  });

  it("returns null for a host who hasn't set a password yet", async () => {
    expect(await verifyHostPassword("approved@example.com", "anything")).toBeNull();
  });

  it("returns null for a PENDING (not approved) host even with a set password", async () => {
    await setHostPassword("host-2", "correct-horse-battery", "correct-horse-battery");
    expect(await verifyHostPassword("pending@example.com", "correct-horse-battery")).toBeNull();
  });

  it("returns null for an unknown email", async () => {
    expect(await verifyHostPassword("nobody@example.com", "anything")).toBeNull();
  });
});

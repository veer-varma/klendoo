import { describe, expect, it, vi, beforeEach } from "vitest";

interface HostRow {
  id: string;
  email: string;
  businessName: string;
  status: string;
}

interface TokenRow {
  id: string;
  hostId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
}

const hosts = new Map<string, HostRow>([
  ["approved@example.com", { id: "host-1", email: "approved@example.com", businessName: "Sable Studio", status: "APPROVED" }],
  ["pending@example.com", { id: "host-2", email: "pending@example.com", businessName: "Not Yet", status: "PENDING" }],
]);
const tokens = new Map<string, TokenRow>();
let tokenCounter = 0;

vi.mock("@klendoo/db", () => ({
  getDb: () => ({
    hostAccount: {
      findUnique: vi.fn(async ({ where }: { where: { email: string } }) => hosts.get(where.email) ?? null),
    },
    magicLinkToken: {
      create: vi.fn(async ({ data }: { data: { hostId: string; expiresAt: Date } }) => {
        tokenCounter += 1;
        const row: TokenRow = {
          id: `token-${tokenCounter}`,
          hostId: data.hostId,
          token: `tok_${tokenCounter}`,
          expiresAt: data.expiresAt,
          usedAt: null,
        };
        tokens.set(row.token, row);
        return row;
      }),
      findUnique: vi.fn(async ({ where }: { where: { token: string } }) => tokens.get(where.token) ?? null),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: { usedAt: Date } }) => {
        const row = [...tokens.values()].find((t) => t.id === where.id);
        if (row) row.usedAt = data.usedAt;
        return row;
      }),
    },
  }),
}));

const sentEmails: { to: string; subject: string; textBody: string }[] = [];
const fakePostmark = {
  sendEmail: vi.fn(async (params: { to: string; subject: string; textBody: string }) => {
    sentEmails.push(params);
    return { messageId: "fake-message-id" };
  }),
} as unknown as import("@klendoo/email").PostmarkClient;

const { requestMagicLink, verifyMagicLink, InvalidMagicLinkError } = await import("./magicLink.js");

beforeEach(() => {
  tokens.clear();
  sentEmails.length = 0;
  vi.clearAllMocks();
});

describe("requestMagicLink", () => {
  it("sends a login link for an approved host", async () => {
    await requestMagicLink("approved@example.com", "https://app.klendoo.com", fakePostmark);

    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe("approved@example.com");
    expect(sentEmails[0].textBody).toContain("https://app.klendoo.com/login/verify?token=");
  });

  it("does nothing for a PENDING (not yet approved) host", async () => {
    await requestMagicLink("pending@example.com", "https://app.klendoo.com", fakePostmark);
    expect(sentEmails).toHaveLength(0);
  });

  it("does nothing for an unknown email, without erroring", async () => {
    await expect(
      requestMagicLink("nobody@example.com", "https://app.klendoo.com", fakePostmark),
    ).resolves.toBeUndefined();
    expect(sentEmails).toHaveLength(0);
  });
});

describe("verifyMagicLink", () => {
  it("returns the hostId for a fresh token and marks it used", async () => {
    await requestMagicLink("approved@example.com", "https://app.klendoo.com", fakePostmark);
    const url = new URL(sentEmails[0].textBody.match(/https:\S+/)![0]);
    const token = url.searchParams.get("token")!;

    const hostId = await verifyMagicLink(token);
    expect(hostId).toBe("host-1");
    expect(tokens.get(token)?.usedAt).not.toBeNull();
  });

  it("rejects a token that's already been used", async () => {
    await requestMagicLink("approved@example.com", "https://app.klendoo.com", fakePostmark);
    const url = new URL(sentEmails[0].textBody.match(/https:\S+/)![0]);
    const token = url.searchParams.get("token")!;

    await verifyMagicLink(token);
    await expect(verifyMagicLink(token)).rejects.toThrow(InvalidMagicLinkError);
  });

  it("rejects an expired token", async () => {
    tokens.set("expired-token", {
      id: "token-expired",
      hostId: "host-1",
      token: "expired-token",
      expiresAt: new Date(Date.now() - 1000),
      usedAt: null,
    });
    await expect(verifyMagicLink("expired-token")).rejects.toThrow(InvalidMagicLinkError);
  });

  it("rejects an unknown token", async () => {
    await expect(verifyMagicLink("does-not-exist")).rejects.toThrow(InvalidMagicLinkError);
  });
});

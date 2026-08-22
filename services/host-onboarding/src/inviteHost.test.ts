import { describe, expect, it, vi, beforeEach } from "vitest";

const plans = new Map<string, Record<string, unknown>>([
  ["starter", { id: "plan-starter", key: "starter", active: true, priceUsd: "0.00" }],
  ["disabled", { id: "plan-disabled", key: "disabled", active: false, priceUsd: "9.99" }],
]);
const created: Record<string, unknown>[] = [];

vi.mock("@klendoo/db", () => ({
  getDb: () => ({
    plan: {
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => plans.get(where.key) ?? null),
    },
    hostAccount: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: "host-invited-1", ...data };
        created.push(row);
        return row;
      }),
    },
  }),
}));

const sentEmails: { to: string; context: string }[] = [];
let emailShouldFail = false;
vi.mock("@klendoo/host-auth", () => ({
  sendMagicLinkEmail: vi.fn(async (host: { email: string }, _baseUrl: string, context: string) => {
    if (emailShouldFail) throw new Error("Postmark send failed (401): Request does not contain a valid Server token.");
    sentEmails.push({ to: host.email, context });
  }),
}));

const { inviteHost, InviteEmailFailedError } = await import("./inviteHost.js");
const { PlanNotFoundError } = await import("./registerHost.js");

beforeEach(() => {
  created.length = 0;
  sentEmails.length = 0;
  emailShouldFail = false;
});

describe("inviteHost", () => {
  it("creates an already-APPROVED host and sends an invite-flavored magic link", async () => {
    const host = await inviteHost(
      { businessName: "Invited Studio", email: "invited@example.com", slug: "invited-studio", planKey: "starter" },
      "https://app.klendoo.com",
    );

    expect(host.status).toBe("APPROVED");
    expect(created[0]).toMatchObject({ status: "APPROVED", planId: "plan-starter" });
    expect((created[0] as { approvedAt: unknown }).approvedAt).toBeInstanceOf(Date);

    expect(sentEmails).toEqual([{ to: "invited@example.com", context: "invite" }]);
  });

  it("throws PlanNotFoundError for an unknown plan key, without creating a host or sending anything", async () => {
    await expect(
      inviteHost(
        { businessName: "X", email: "x@example.com", slug: "x", planKey: "nonexistent" },
        "https://app.klendoo.com",
      ),
    ).rejects.toThrow(PlanNotFoundError);

    expect(created).toHaveLength(0);
    expect(sentEmails).toHaveLength(0);
  });

  it("throws PlanNotFoundError for an inactive plan", async () => {
    await expect(
      inviteHost(
        { businessName: "X", email: "x@example.com", slug: "x", planKey: "disabled" },
        "https://app.klendoo.com",
      ),
    ).rejects.toThrow(PlanNotFoundError);
  });

  it("throws InviteEmailFailedError (not a silent no-op) when the host is created but the email fails", async () => {
    emailShouldFail = true;

    await expect(
      inviteHost(
        { businessName: "Invited Studio", email: "invited@example.com", slug: "invited-studio", planKey: "starter" },
        "https://app.klendoo.com",
      ),
    ).rejects.toThrow(InviteEmailFailedError);

    // The host account still exists and is still APPROVED — this isn't a
    // rollback, it's surfacing that partial state accurately.
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ status: "APPROVED" });
  });
});

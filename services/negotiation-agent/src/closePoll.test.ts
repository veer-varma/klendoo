import { describe, expect, it, vi, beforeEach } from "vitest";

interface FixtureSlot {
  id: string;
  startTime: Date;
  endTime: Date;
}
interface FixtureResponse {
  slotId: string;
  available: boolean;
}
interface FixtureInvitee {
  id: string;
  name: string;
  email: string;
  token: string;
  responses: FixtureResponse[];
}
interface FixturePoll {
  id: string;
  hostName: string;
  hostEmail: string;
  title: string;
  deadline: Date;
  status: string;
  slots: FixtureSlot[];
  invitees: FixtureInvitee[];
}

let pollFixture: FixturePoll;
const updates: { model: string; args: unknown }[] = [];
const created: { model: string; args: unknown }[] = [];
const trustEdgeCalls: unknown[] = [];

vi.mock("@klendoo/db", () => ({
  getDb: () => ({
    schedulingPoll: {
      findUnique: vi.fn(async () => pollFixture),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        updates.push({ model: "schedulingPoll", args: { where, data } });
        Object.assign(pollFixture, data);
        return pollFixture;
      }),
    },
    calendarEvent: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        created.push({ model: "calendarEvent", args: data });
        return { id: "event-1", ...data };
      }),
    },
    pollInvitee: {
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        updates.push({ model: "pollInvitee", args: { where, data } });
        return { id: where.id, ...data };
      }),
    },
    // Only present so recordNegotiationTrust's underlying recordEdgeUsage
    // call (via @klendoo/trust-graph) has something real to hit instead of
    // throwing — its own error handling is unit-tested separately in
    // recordNegotiationTrust.test.ts, this just confirms it's invoked.
    trustEdge: {
      upsert: vi.fn(async (args: unknown) => {
        trustEdgeCalls.push(args);
        return { id: "edge-1" };
      }),
    },
  }),
}));

const { closeAndFinalizePoll } = await import("./closePoll.js");

function makeFixture(overrides: Partial<FixturePoll> = {}): FixturePoll {
  const slotA: FixtureSlot = {
    id: "slot-a",
    startTime: new Date("2026-08-20T14:00:00.000Z"),
    endTime: new Date("2026-08-20T14:30:00.000Z"),
  };
  const slotB: FixtureSlot = {
    id: "slot-b",
    startTime: new Date("2026-08-21T15:00:00.000Z"),
    endTime: new Date("2026-08-21T15:30:00.000Z"),
  };
  return {
    id: "poll-1",
    hostName: "Priya Raman",
    hostEmail: "priya@priyaraman.coach",
    title: "Kickoff call",
    deadline: new Date("2026-08-19T00:00:00.000Z"),
    status: "OPEN",
    slots: [slotA, slotB],
    invitees: [
      {
        id: "inv-alex",
        name: "Alex",
        email: "alex@example.com",
        token: "tok-alex",
        responses: [{ slotId: "slot-a", available: true }],
      },
      {
        id: "inv-jordan",
        name: "Jordan",
        email: "jordan@example.com",
        token: "tok-jordan",
        responses: [{ slotId: "slot-a", available: false }],
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  updates.length = 0;
  created.length = 0;
  trustEdgeCalls.length = 0;
  pollFixture = makeFixture();
  process.env.PUBLIC_BASE_URL = "https://klendoo.com";
});

function mockPostmark() {
  return { sendEmail: vi.fn(async () => ({ messageId: "msg-1" })) } as unknown as import("@klendoo/email").PostmarkClient;
}

describe("closeAndFinalizePoll", () => {
  it("finalizes on a clear majority, writes the CalendarEvent, and emails everyone appropriately", async () => {
    const postmark = mockPostmark();

    const result = await closeAndFinalizePoll("poll-1", postmark);

    expect(result).toEqual({ pollId: "poll-1", outcome: "FINALIZED", winningSlotId: "slot-a" });
    expect(pollFixture.status).toBe("FINALIZED");

    const eventCreate = created.find((c) => c.model === "calendarEvent");
    expect(eventCreate?.args).toMatchObject({
      attendees: "alex@example.com",
      pollId: "poll-1",
    });

    // Alex (available) gets a confirmation; Jordan (unavailable) gets a reconsider email; host gets one too.
    expect(postmark.sendEmail).toHaveBeenCalledTimes(3);
    const calls = (postmark.sendEmail as ReturnType<typeof vi.fn>).mock.calls.map(
      (c: unknown[]) => c[0] as { to: string },
    );
    expect(calls.some((e) => e.to === "alex@example.com")).toBe(true);
    expect(calls.some((e) => e.to === "jordan@example.com")).toBe(true);
    expect(calls.some((e) => e.to === "priya@priyaraman.coach")).toBe(true);

    // Jordan's reconsiderSentAt should have been stamped.
    const inviteeUpdate = updates.find(
      (u) => u.model === "pollInvitee" && (u.args as { where: { id: string } }).where.id === "inv-jordan",
    );
    expect(inviteeUpdate).toBeDefined();

    // Trust is recorded for the confirmed attendee (Alex), not the
    // unavailable invitee (Jordan) — following through is the signal.
    expect(trustEdgeCalls).toHaveLength(1);
  });

  it("cancels instead of finalizing when nobody marked anything available", async () => {
    pollFixture = makeFixture({
      invitees: [
        {
          id: "inv-alex",
          name: "Alex",
          email: "alex@example.com",
          token: "tok-alex",
          responses: [{ slotId: "slot-a", available: false }],
        },
      ],
    });
    const postmark = mockPostmark();

    const result = await closeAndFinalizePoll("poll-1", postmark);

    expect(result).toEqual({ pollId: "poll-1", outcome: "CANCELLED" });
    expect(pollFixture.status).toBe("CANCELLED");
    expect(created).toHaveLength(0);
    expect(postmark.sendEmail).toHaveBeenCalledTimes(1);
    const [emailArg] = (postmark.sendEmail as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(emailArg.to).toBe("priya@priyaraman.coach");
    expect(emailArg.subject).toContain("No one could make");
  });

  it("throws if the poll is not OPEN", async () => {
    pollFixture = makeFixture({ status: "DRAFT" });
    await expect(closeAndFinalizePoll("poll-1", mockPostmark())).rejects.toThrow("not OPEN");
  });
});

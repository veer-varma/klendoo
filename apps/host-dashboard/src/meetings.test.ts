import { describe, expect, it, vi, beforeEach } from "vitest";

const hosts = new Map<string, Record<string, unknown>>([
  ["host-1", { id: "host-1", businessName: "Sable Studio", email: "hana@sablestudio.co" }],
]);
const polls: Record<string, unknown>[] = [];
let idCounter = 0;

vi.mock("@klendoo/db", () => ({
  getDb: () => ({
    hostAccount: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => hosts.get(where.id) ?? null),
    },
    schedulingPoll: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        idCounter += 1;
        const row = { id: `poll-${idCounter}`, status: "DRAFT", ...data };
        polls.push(row);
        return row;
      }),
      findMany: vi.fn(async ({ where }: { where: { hostId: string } }) =>
        polls.filter((p) => p.hostId === where.hostId),
      ),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => polls.find((p) => p.id === where.id) ?? null),
    },
  }),
}));

const { createHostMeeting, getHostMeeting, InvalidMeetingError, HostNotFoundError } = await import(
  "./meetings.js"
);

const validInput = {
  title: "Kickoff call",
  deadline: "2026-09-01T00:00:00.000Z",
  slots: [{ startTime: "2026-09-02T14:00:00.000Z", endTime: "2026-09-02T14:30:00.000Z" }],
  invitees: [{ name: "Alex Kim", email: "alex@example.com" }],
};

beforeEach(() => {
  polls.length = 0;
  idCounter = 0;
});

describe("createHostMeeting", () => {
  it("creates a DRAFT poll tied to the host", async () => {
    const poll = await createHostMeeting("host-1", validInput);
    expect(poll.status).toBe("DRAFT");
    expect((poll as Record<string, unknown>).hostId).toBe("host-1");
    expect((poll as Record<string, unknown>).hostEmail).toBe("hana@sablestudio.co");
  });

  it("throws HostNotFoundError for an unknown host", async () => {
    await expect(createHostMeeting("nobody", validInput)).rejects.toThrow(HostNotFoundError);
  });

  it("rejects an empty title", async () => {
    await expect(createHostMeeting("host-1", { ...validInput, title: "  " })).rejects.toThrow(InvalidMeetingError);
  });

  it("rejects zero slots", async () => {
    await expect(createHostMeeting("host-1", { ...validInput, slots: [] })).rejects.toThrow(InvalidMeetingError);
  });

  it("rejects a slot where end is before start", async () => {
    await expect(
      createHostMeeting("host-1", {
        ...validInput,
        slots: [{ startTime: "2026-09-02T14:30:00.000Z", endTime: "2026-09-02T14:00:00.000Z" }],
      }),
    ).rejects.toThrow(InvalidMeetingError);
  });

  it("rejects zero invitees", async () => {
    await expect(createHostMeeting("host-1", { ...validInput, invitees: [] })).rejects.toThrow(InvalidMeetingError);
  });

  it("rejects an invalid invitee email", async () => {
    await expect(
      createHostMeeting("host-1", { ...validInput, invitees: [{ name: "Alex", email: "not-an-email" }] }),
    ).rejects.toThrow(InvalidMeetingError);
  });
});

describe("getHostMeeting", () => {
  it("returns null if the poll belongs to a different host", async () => {
    const poll = await createHostMeeting("host-1", validInput);
    expect(await getHostMeeting("host-2", poll.id)).toBeNull();
  });

  it("returns null for a nonexistent poll", async () => {
    expect(await getHostMeeting("host-1", "does-not-exist")).toBeNull();
  });
});

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const hosts = new Map<string, Record<string, unknown>>([
  ["sable-studio", { id: "host-1", slug: "sable-studio", email: "hana@sablestudio.co", businessName: "Sable Studio", status: "APPROVED" }],
  ["pending-biz", { id: "host-2", slug: "pending-biz", email: "p@example.com", businessName: "Pending Biz", status: "PENDING" }],
]);

const now = new Date("2026-08-18T12:00:00.000Z");
const events = [
  { hostEmail: "hana@sablestudio.co", startTime: new Date("2026-08-19T14:00:00.000Z"), endTime: new Date("2026-08-19T14:30:00.000Z"), title: "Secret meeting title", attendees: "someone@example.com" },
  { hostEmail: "hana@sablestudio.co", startTime: new Date("2026-12-01T14:00:00.000Z"), endTime: new Date("2026-12-01T14:30:00.000Z"), title: "Far future, outside window", attendees: "x" },
];

vi.mock("@klendoo/db", () => ({
  getDb: () => ({
    hostAccount: {
      findUnique: vi.fn(async ({ where }: { where: { slug: string } }) => hosts.get(where.slug) ?? null),
    },
    calendarEvent: {
      findMany: vi.fn(async ({ where }: { where: { hostEmail: string; startTime: { gte: Date; lte: Date } } }) =>
        events
          .filter(
            (e) =>
              e.hostEmail === where.hostEmail &&
              e.startTime >= where.startTime.gte &&
              e.startTime <= where.startTime.lte,
          )
          .map((e) => ({ startTime: e.startTime, endTime: e.endTime })),
      ),
    },
  }),
}));

const { getPublicCalendar } = await import("./publicCalendar.js");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getPublicCalendar", () => {
  it("returns busy blocks within the lookahead window for an approved host", async () => {
    const result = await getPublicCalendar("sable-studio");
    expect(result).not.toBeNull();
    expect(result!.businessName).toBe("Sable Studio");
    expect(result!.busyBlocks).toHaveLength(1);
    expect(result!.busyBlocks[0].startTime).toEqual(new Date("2026-08-19T14:00:00.000Z"));
  });

  it("never includes title or attendee fields — busy/free only", async () => {
    const result = await getPublicCalendar("sable-studio");
    const block = result!.busyBlocks[0] as unknown as Record<string, unknown>;
    expect(block.title).toBeUndefined();
    expect(block.attendees).toBeUndefined();
  });

  it("returns null for a PENDING (not yet approved) host", async () => {
    expect(await getPublicCalendar("pending-biz")).toBeNull();
  });

  it("returns null for an unknown slug", async () => {
    expect(await getPublicCalendar("does-not-exist")).toBeNull();
  });
});

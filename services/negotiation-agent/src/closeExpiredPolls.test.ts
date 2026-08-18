import { describe, expect, it, vi } from "vitest";

const foundPolls = [{ id: "poll-1" }, { id: "poll-2" }];
const findMany = vi.fn(async () => foundPolls);

vi.mock("@klendoo/db", () => ({
  getDb: () => ({ schedulingPoll: { findMany } }),
}));

const closeAndFinalizePoll = vi.fn(async (id: string) => ({ pollId: id, outcome: "FINALIZED" as const }));
vi.mock("./closePoll.js", () => ({ closeAndFinalizePoll }));

const { closeExpiredPolls } = await import("./closeExpiredPolls.js");

describe("closeExpiredPolls", () => {
  it("closes every OPEN poll past its deadline and returns each result", async () => {
    const now = new Date("2026-08-25T00:00:00.000Z");

    const results = await closeExpiredPolls(now);

    expect(findMany).toHaveBeenCalledWith({
      where: { status: "OPEN", deadline: { lt: now } },
      select: { id: true },
    });
    expect(closeAndFinalizePoll).toHaveBeenCalledTimes(2);
    expect(closeAndFinalizePoll).toHaveBeenCalledWith("poll-1");
    expect(closeAndFinalizePoll).toHaveBeenCalledWith("poll-2");
    expect(results).toEqual([
      { pollId: "poll-1", outcome: "FINALIZED" },
      { pollId: "poll-2", outcome: "FINALIZED" },
    ]);
  });
});

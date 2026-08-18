import { describe, expect, it, vi, beforeEach } from "vitest";

const created: Record<string, unknown>[] = [];

vi.mock("@klendoo/db", () => ({
  getDb: () => ({
    schedulingPoll: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: "poll-1", status: "DRAFT", ...data };
        created.push(row);
        return row;
      }),
    },
  }),
}));

const { createDraftPoll } = await import("./createDraftPoll.js");
const { samplePollDraft } = await import("./seedPolls.js");

beforeEach(() => {
  created.length = 0;
});

describe("createDraftPoll", () => {
  it("passes slots and invitees through as nested creates", async () => {
    const draft = samplePollDraft({ title: "Kickoff call" });

    const poll = await createDraftPoll(draft);

    expect(poll.status).toBe("DRAFT");
    const [row] = created as Array<{
      title: string;
      slots: { create: unknown[] };
      invitees: { create: unknown[] };
    }>;
    expect(row.title).toBe("Kickoff call");
    expect(row.slots.create).toHaveLength(2);
    expect(row.invitees.create).toHaveLength(2);
  });
});

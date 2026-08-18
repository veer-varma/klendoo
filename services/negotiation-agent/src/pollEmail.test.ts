import { describe, expect, it } from "vitest";
import { buildPollInvitationEmail, buildReconsiderEmail } from "./pollEmail.js";

const base = {
  hostName: "Priya Raman",
  title: "Kickoff call",
  deadline: "2026-09-01T00:00:00.000Z",
  inviteeName: "Alex",
  inviteeEmail: "alex@example.com",
  responseUrl: "https://klendoo.com/polls/tok123",
  slots: [
    { startTime: "2026-08-20T14:00:00.000Z", endTime: "2026-08-20T14:30:00.000Z" },
    { startTime: "2026-08-21T15:00:00.000Z", endTime: "2026-08-21T15:30:00.000Z" },
  ],
};

describe("buildPollInvitationEmail", () => {
  it("lists every candidate slot and includes the response link", () => {
    const email = buildPollInvitationEmail(base);
    expect(email.to).toBe("alex@example.com");
    expect(email.subject).toContain("Priya Raman");
    expect(email.textBody).toContain("https://klendoo.com/polls/tok123");
    expect(email.textBody).toContain("1.");
    expect(email.textBody).toContain("2.");
  });
});

describe("buildReconsiderEmail", () => {
  it("names the winning slot in the subject", () => {
    const email = buildReconsiderEmail({
      ...base,
      winningSlot: { startTime: "2026-08-20T14:00:00.000Z" },
    });
    expect(email.subject).toContain(new Date("2026-08-20T14:00:00.000Z").toUTCString());
    expect(email.textBody).toContain("most people picked");
  });
});

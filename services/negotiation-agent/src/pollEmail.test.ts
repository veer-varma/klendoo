import { describe, expect, it } from "vitest";
import {
  buildPollInvitationEmail,
  buildReconsiderEmail,
  buildAttendeeConfirmationEmail,
  buildHostConfirmationEmail,
  buildNoConsensusEmail,
} from "./pollEmail.js";

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

const winningSlot = { startTime: "2026-08-20T14:00:00.000Z", endTime: "2026-08-20T14:30:00.000Z" };

describe("buildAttendeeConfirmationEmail", () => {
  it("confirms the winning slot to the specific attendee", () => {
    const email = buildAttendeeConfirmationEmail({
      hostName: "Priya Raman",
      title: "Kickoff call",
      winningSlot,
      inviteeName: "Alex",
      inviteeEmail: "alex@example.com",
    });
    expect(email.to).toBe("alex@example.com");
    expect(email.subject).toContain("Confirmed");
    expect(email.textBody).toContain(new Date(winningSlot.startTime).toUTCString());
  });
});

describe("buildHostConfirmationEmail", () => {
  it("lists confirmed attendees to the host", () => {
    const email = buildHostConfirmationEmail({
      hostName: "Priya Raman",
      hostEmail: "priya@priyaraman.coach",
      title: "Kickoff call",
      winningSlot,
      attendeeNames: ["Alex", "Jordan"],
    });
    expect(email.to).toBe("priya@priyaraman.coach");
    expect(email.textBody).toContain("Alex, Jordan");
  });

  it("says 'no one else' when nobody else is attending", () => {
    const email = buildHostConfirmationEmail({
      hostName: "Priya Raman",
      hostEmail: "priya@priyaraman.coach",
      title: "Kickoff call",
      winningSlot,
      attendeeNames: [],
    });
    expect(email.textBody).toContain("no one else");
  });
});

describe("buildNoConsensusEmail", () => {
  it("tells the host nobody found a workable time", () => {
    const email = buildNoConsensusEmail({
      hostName: "Priya Raman",
      hostEmail: "priya@priyaraman.coach",
      title: "Kickoff call",
    });
    expect(email.to).toBe("priya@priyaraman.coach");
    expect(email.subject).toContain("No one could make");
  });
});

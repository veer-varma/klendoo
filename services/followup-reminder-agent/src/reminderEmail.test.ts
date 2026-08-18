import { describe, expect, it } from "vitest";
import { buildReminderEmail } from "./reminderEmail.js";
import { sampleBookingContext } from "./seedContexts.js";

describe("buildReminderEmail", () => {
  it("addresses the visitor and names both parties and the meeting", () => {
    const context = sampleBookingContext({
      hostName: "Dr. Varma",
      visitorName: "Alex",
      visitorEmail: "alex@example.com",
      meetingTitle: "Intro call",
    });

    const email = buildReminderEmail(context);

    expect(email.to).toBe("alex@example.com");
    expect(email.subject).toContain("Intro call");
    expect(email.subject).toContain("Dr. Varma");
    expect(email.textBody).toContain("Hi Alex");
    expect(email.textBody).toContain("Dr. Varma");
  });
});

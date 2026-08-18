import { describe, expect, it } from "vitest";
import { renderResponseForm, renderResponseThanks } from "./responseForm.js";

describe("renderResponseForm", () => {
  const base = {
    pollTitle: "Kickoff call",
    hostName: "Priya Raman",
    deadline: "2026-09-01T00:00:00.000Z",
    inviteeName: "Alex <script>",
    slots: [
      { id: "slot-1", startTime: "2026-08-20T14:00:00.000Z", endTime: "2026-08-20T14:30:00.000Z" },
      { id: "slot-2", startTime: "2026-08-21T15:00:00.000Z", endTime: "2026-08-21T15:30:00.000Z" },
    ],
  };

  it("renders one checkbox per slot, named by slot id", () => {
    const html = renderResponseForm(base);
    expect(html).toContain('name="slot_slot-1"');
    expect(html).toContain('name="slot_slot-2"');
  });

  it("escapes invitee-controlled and host-controlled text", () => {
    const html = renderResponseForm(base);
    expect(html).not.toContain("<script>");
    expect(html).toContain("Alex &lt;script&gt;");
  });

  it("pre-checks slots already marked available on a re-visit", () => {
    const html = renderResponseForm({ ...base, existingAvailable: ["slot-2"] });
    const slot1 = html.split('name="slot_slot-1"')[1].split(">")[0];
    const slot2 = html.split('name="slot_slot-2"')[1].split(">")[0];
    expect(slot1).not.toContain("checked");
    expect(slot2).toContain("checked");
  });
});

describe("renderResponseThanks", () => {
  it("escapes the poll title", () => {
    const html = renderResponseThanks("Kickoff <script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("Kickoff &lt;script&gt;");
  });
});

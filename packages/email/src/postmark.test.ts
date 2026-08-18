import { describe, expect, it, vi } from "vitest";
import { PostmarkClient } from "./postmark.js";

function mockFetch(response: { ok: boolean; status: number; body: unknown }) {
  return vi.fn(async () => ({
    ok: response.ok,
    status: response.status,
    json: async () => response.body,
  })) as unknown as typeof fetch;
}

describe("PostmarkClient", () => {
  it("sends an email and returns the messageId on success", async () => {
    const fetchImpl = mockFetch({ ok: true, status: 200, body: { MessageID: "msg-123" } });
    const client = new PostmarkClient({ serverToken: "test-token", fetchImpl });

    const result = await client.sendEmail({
      to: "visitor@example.com",
      subject: "Reminder",
      textBody: "hello",
    });

    expect(result.messageId).toBe("msg-123");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.postmarkapp.com/email",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-Postmark-Server-Token": "test-token" }),
      }),
    );
  });

  it("throws if POSTMARK_SERVER_API_TOKEN / serverToken is not set", async () => {
    const previous = process.env.POSTMARK_SERVER_API_TOKEN;
    delete process.env.POSTMARK_SERVER_API_TOKEN;

    const client = new PostmarkClient({ fetchImpl: mockFetch({ ok: true, status: 200, body: {} }) });

    await expect(
      client.sendEmail({ to: "a@example.com", subject: "s", textBody: "b" }),
    ).rejects.toThrow("POSTMARK_SERVER_API_TOKEN");

    if (previous !== undefined) process.env.POSTMARK_SERVER_API_TOKEN = previous;
  });

  it("throws with the Postmark error message when the API rejects the request", async () => {
    const fetchImpl = mockFetch({
      ok: false,
      status: 422,
      body: { Message: "Invalid 'To' address" },
    });
    const client = new PostmarkClient({ serverToken: "test-token", fetchImpl });

    await expect(
      client.sendEmail({ to: "not-an-email", subject: "s", textBody: "b" }),
    ).rejects.toThrow("Invalid 'To' address");
  });
});

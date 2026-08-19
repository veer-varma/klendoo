import { describe, expect, it, vi } from "vitest";
import { payViaIntermezzo } from "./intermezzoClient.js";

function mockFetch(response: { ok: boolean; status: number; body: unknown }) {
  return vi.fn(async () => ({
    ok: response.ok,
    status: response.status,
    text: async () => JSON.stringify(response.body),
  })) as unknown as typeof fetch;
}

describe("payViaIntermezzo", () => {
  it("posts user_id and url to the gateway's x402/fetch route with the key on both header forms", async () => {
    const fetchImpl = mockFetch({ ok: true, status: 200, body: { status: 200, payer: "ADDR123" } });

    const result = await payViaIntermezzo("host-1", "https://klendoo.com/agents/reminder", {
      gatewayUrl: "https://gateway.internal",
      apiKey: "test-key",
      fetchImpl,
    });

    expect(result.payer).toBe("ADDR123");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://gateway.internal/v1/wallet/x402/fetch/",
      expect.objectContaining({
        method: "POST",
        // Sent both ways — Manus's own docs disagree on which the gateway
        // actually checks, see intermezzoClient.ts's comment.
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
          "X-Klendoo-API-Key": "test-key",
        }),
        body: JSON.stringify({ user_id: "host-1", url: "https://klendoo.com/agents/reminder" }),
      }),
    );
  });

  it("throws a clear error when INTERMEZZO_GATEWAY_URL is not set", async () => {
    await expect(
      payViaIntermezzo("host-1", "https://x", { apiKey: "k", fetchImpl: mockFetch({ ok: true, status: 200, body: {} }) }),
    ).rejects.toThrow("INTERMEZZO_GATEWAY_URL");
  });

  it("throws a clear error when KLENDOO_INTERMEZZO_API_KEY is not set", async () => {
    await expect(
      payViaIntermezzo("host-1", "https://x", {
        gatewayUrl: "https://gateway.internal",
        fetchImpl: mockFetch({ ok: true, status: 200, body: {} }),
      }),
    ).rejects.toThrow("KLENDOO_INTERMEZZO_API_KEY");
  });

  it("throws with the gateway's error message on a non-2xx response", async () => {
    const fetchImpl = mockFetch({ ok: false, status: 402, body: { message: "insufficient TestNet USDC balance" } });

    await expect(
      payViaIntermezzo("host-1", "https://x", {
        gatewayUrl: "https://gateway.internal",
        apiKey: "k",
        fetchImpl,
      }),
    ).rejects.toThrow("insufficient TestNet USDC balance");
  });
});

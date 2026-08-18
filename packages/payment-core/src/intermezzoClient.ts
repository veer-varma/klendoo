/**
 * Client for Klendoo's scoped Intermezzo gateway — pays an x402-gated URL on
 * behalf of a specific custodial user wallet, per Manus's "Claude
 * Development Handoff — Klendoo" (2026-08-17).
 *
 * Deliberately calls only the scoped gateway, never raw Intermezzo/Vault:
 * "The scoped Klendoo gateway is responsible for preserving the Vault
 * boundary; do not call the raw Intermezzo authentication endpoint from
 * Klendoo code." This code never sees a Vault token, AppRole credential, or
 * private key — only KLENDOO_INTERMEZZO_API_KEY, a scoped gateway secret.
 */

const FETCH_PATH = "/v1/wallet/x402/fetch/";

export interface PayViaIntermezzoOptions {
  /**
   * Base URL of the scoped Klendoo gateway. Not finalized yet as of the
   * 2026-08-17 handoff ("the final network attachment and stable internal
   * gateway route must be added through the separate intermezzo-infra
   * deployment configuration") — set INTERMEZZO_GATEWAY_URL once it is.
   */
  gatewayUrl?: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}

export interface IntermezzoFetchResult {
  status?: number;
  body?: unknown;
  payer?: string;
  paymentResponse?: unknown;
}

/**
 * Pays `url` (an x402-gated resource) using the custodial wallet belonging
 * to `userId`. The gateway signs via Vault on that user's behalf and
 * handles the 402 challenge/retry — see intermezzo-x402's x402-client
 * .service.ts for the reference implementation this contract matches.
 */
export async function payViaIntermezzo(
  userId: string,
  url: string,
  options: PayViaIntermezzoOptions = {},
): Promise<IntermezzoFetchResult> {
  const gatewayUrl = options.gatewayUrl ?? process.env.INTERMEZZO_GATEWAY_URL;
  const apiKey = options.apiKey ?? process.env.KLENDOO_INTERMEZZO_API_KEY;
  const fetchImpl = options.fetchImpl ?? fetch;

  if (!gatewayUrl) {
    throw new Error(
      "INTERMEZZO_GATEWAY_URL is not set — the internal gateway route isn't finalized yet " +
        "(see Manus's Claude Development Handoff, 2026-08-17).",
    );
  }
  if (!apiKey) {
    throw new Error(
      "KLENDOO_INTERMEZZO_API_KEY is not set — cannot authenticate to the Intermezzo gateway.",
    );
  }

  const response = await fetchImpl(new URL(FETCH_PATH, gatewayUrl).toString(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ user_id: userId, url }),
  });

  const text = await response.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // not JSON, leave as text
  }

  if (!response.ok) {
    const message =
      body && typeof body === "object" && body !== null && "message" in body
        ? String((body as { message?: unknown }).message)
        : `Intermezzo gateway request failed (${response.status})`;
    throw new Error(message);
  }

  return body as IntermezzoFetchResult;
}

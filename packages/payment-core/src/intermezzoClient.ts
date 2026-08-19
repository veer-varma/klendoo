/**
 * Client for Klendoo's scoped Intermezzo gateway — pays an x402-gated URL on
 * behalf of a specific custodial user wallet, per Manus's "Claude
 * Development Handoff — Klendoo" (2026-08-17, refreshed 2026-08-19).
 *
 * Deliberately calls only the scoped gateway, never raw Intermezzo/Vault:
 * "The scoped Klendoo gateway is responsible for preserving the Vault
 * boundary; do not call the raw Intermezzo authentication endpoint from
 * Klendoo code." This code never sees a Vault token, AppRole credential, or
 * private key — only KLENDOO_INTERMEZZO_API_KEY, a scoped gateway secret.
 *
 * A real TestNet settlement through this same gateway (0.01 USDC,
 * `LZWJ3KVLO...` → `FCITWYEUGM...`) succeeded end-to-end on 2026-08-18 —
 * see Manus's Intermezzo TestNet Validation Status — confirming the gateway
 * itself, the network id, and the payer/receiver wallets all work; the only
 * thing that test doesn't confirm is which auth header this specific
 * client code should send (see below).
 */

const FETCH_PATH = "/v1/wallet/x402/fetch/";

export interface PayViaIntermezzoOptions {
  /**
   * Base URL of the scoped Klendoo gateway. Finalized as of Manus's
   * 2026-08-19 secret provisioning: `http://intermezzo-gateway:8080` on
   * the private `intermezzo-testnet-client` Docker network — the calling
   * service's container must be joined to that network (see
   * docker-compose.yml) for this hostname to resolve. Set via
   * INTERMEZZO_GATEWAY_URL.
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
      // Manus's docs disagree with themselves on this: the 2026-08-17
      // handoff's example contract shows `Authorization: Bearer <token>`,
      // but the 2026-08-19 secret-inventory table's implementation note
      // for KLENDOO_INTERMEZZO_API_KEY says "Send only as the server-side
      // X-Klendoo-API-Key header." Sending both rather than guessing which
      // is authoritative — harmless if the gateway ignores the one it
      // doesn't check, and avoids silently breaking real payment calls on
      // a launch night over an auth-header guess. Worth confirming with
      // Manus/Ops and dropping whichever one turns out to be unused.
      Authorization: `Bearer ${apiKey}`,
      "X-Klendoo-API-Key": apiKey,
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

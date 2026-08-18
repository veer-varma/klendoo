import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import type {
  SettleResultContext,
  SettleFailureContext,
  HTTPTransportContext,
} from "@x402/core/server";
import { ExactAvmScheme } from "@x402/avm/exact/server";
import { ALGORAND_MAINNET_CAIP2, ALGORAND_TESTNET_CAIP2 } from "./network.js";
import { recordSettlement, recordSettlementFailure } from "./settlementLog.js";

const DEFAULT_FACILITATOR_URL = "https://facilitator.goplausible.xyz";

/**
 * Routes are tagged with `extra: { actionType: "reminder" }` (etc.) in their
 * PaymentOption config (see each service's src/server.ts) so the shared
 * onAfterSettle/onSettleFailure hooks below know which ClientInteraction
 * actionType to log, without needing a separate resource server per agent.
 */
function readActionType(requirementsExtra: Readonly<Record<string, unknown>> | undefined): string {
  const value = requirementsExtra?.actionType;
  return typeof value === "string" ? value : "unknown";
}

/**
 * Pulls contextRef (which booking/context a paid action is for) out of the
 * original request. Confirmed against @x402/core's real shipped types:
 * transportContext is `HTTPTransportContext` for HTTP resource servers,
 * exposing `request.adapter` (getQueryParam()/getBody()).
 *
 * Checks query params first, not just the body: Intermezzo's x402/fetch
 * gateway only ever issues a plain GET with no body (confirmed against its
 * reference x402-client.service.ts — `fetchWithPayment(url, { method: "GET" })`),
 * so a caller paying through Intermezzo can only pass context via the URL.
 * Body is still checked as a fallback for any route invoked some other way.
 */
export function extractContextRef(transportContext: unknown): string | undefined {
  const transport = transportContext as HTTPTransportContext | undefined;
  const adapter = transport?.request?.adapter;

  const fromQuery = adapter?.getQueryParam?.("contextRef");
  if (typeof fromQuery === "string") return fromQuery;

  const body = adapter?.getBody?.();
  if (body && typeof body === "object" && "contextRef" in body) {
    const value = (body as { contextRef?: unknown }).contextRef;
    return typeof value === "string" ? value : undefined;
  }
  return undefined;
}

/**
 * Exported standalone (rather than inlined as a closure in createResourceServer)
 * specifically so it's unit-testable without exercising the real
 * x402ResourceServer verify/settle machinery, which needs a live facilitator.
 */
export async function handleAfterSettle(ctx: SettleResultContext): Promise<void> {
  await recordSettlement({
    actionType: readActionType(ctx.requirements.extra),
    amount: ctx.result.amount ?? ctx.requirements.amount,
    network: ctx.result.network,
    txnHash: ctx.result.transaction,
    contextRef: extractContextRef(ctx.transportContext),
  });
}

export async function handleSettleFailure(ctx: SettleFailureContext): Promise<void> {
  await recordSettlementFailure({
    actionType: readActionType(ctx.requirements.extra),
    amount: ctx.requirements.amount,
    network: ctx.requirements.network,
    reason: ctx.error.message,
    contextRef: extractContextRef(ctx.transportContext),
  });
}

/**
 * The shared x402ResourceServer for every paid Klendoo agent endpoint.
 * Registered for both testnet and mainnet CAIP-2 network ids so one
 * deployment can serve whichever network resolveNetwork() selects — mainnet
 * stays inert in practice without a mainnet-scoped GOPLAUSIBLE_API_KEY (not
 * provisioned yet; see Manus's Development Handoff, 2026-08-17: "Mainnet ...
 * Explicitly not authorized").
 *
 * There's no imperative settle()-style call anymore (see git history for
 * Sprint 0/1's version) — x402 is buyer-initiated, so settlement is
 * something that happens *to* this server via the middleware, not something
 * Klendoo's own code triggers. These hooks are how we find out about it.
 */
export function createResourceServer(): x402ResourceServer {
  const facilitator = new HTTPFacilitatorClient({
    url: process.env.FACILITATOR_URL || DEFAULT_FACILITATOR_URL,
  });

  return new x402ResourceServer(facilitator)
    .register(ALGORAND_TESTNET_CAIP2, new ExactAvmScheme())
    .register(ALGORAND_MAINNET_CAIP2, new ExactAvmScheme())
    .onAfterSettle(handleAfterSettle)
    .onSettleFailure(handleSettleFailure);
}

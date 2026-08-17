import { getDb } from "@klendoo/db";
import { GoPlausibleFacilitator, type Facilitator } from "./facilitator.js";
import { resolveDefaultPrice } from "./pricing.js";
import type { ActionType, Network, SettleOptions, SettlementResult } from "./types.js";

function resolveNetwork(options?: SettleOptions): Network {
  if (options?.network) return options.network;
  const env = process.env.ALGOD_NETWORK;
  return env === "mainnet" || env === "algorand-mainnet"
    ? "algorand-mainnet"
    : "algorand-testnet";
}

/**
 * Settles one priced action. This is the Sprint 0 skeleton described in
 * Klendoo_Sprint_Plan.md: "settlement SDK skeleton — settle(actionType, amount)
 * -> TxnHash, reading price from a config value (not hardcoded), pointed at
 * Algorand testnet until the Ops Agent confirms mainnet wallet is funded."
 *
 * It logs a ClientInteraction row before and after attempting settlement so
 * failed attempts are visible, not just successful ones. The actual
 * facilitator call is not wired up yet (see GoPlausibleFacilitator) — that
 * lands in Sprint 1 along with the Reminder & Follow-up agent.
 */
export async function settle(
  actionType: ActionType,
  options: SettleOptions = {},
  facilitator: Facilitator = new GoPlausibleFacilitator(),
): Promise<SettlementResult> {
  const network = resolveNetwork(options);
  const amount = options.amount ?? (await resolveDefaultPrice(actionType));

  const interaction = await getDb().clientInteraction.create({
    data: {
      actionType,
      amount,
      network,
      contextRef: options.contextRef,
      status: "PENDING",
    },
  });

  try {
    const { txnHash } = await facilitator.settle({ actionType, amount, network });

    await getDb().clientInteraction.update({
      where: { id: interaction.id },
      data: { status: "SETTLED", txnHash, settledAt: new Date() },
    });

    return {
      txnHash,
      amount,
      currency: "USDC",
      network,
      interactionId: interaction.id,
    };
  } catch (err) {
    await getDb().clientInteraction.update({
      where: { id: interaction.id },
      data: { status: "FAILED" },
    });
    throw err;
  }
}

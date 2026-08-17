import { getDb } from "@klendoo/db";
import type { ActionType } from "./types.js";

const DEFAULT_PRICE_SETTING_KEY = "default_action_price_usdc";

/**
 * Resolves the per-action settlement price from PlatformSetting, per the
 * pricing correction in Klendoo_Product_Definition_Trust_Graph_Spec.md §4:
 * "Default action price should be a PlatformSetting value ($0.15), not
 * hardcoded per-agent constants in payment-core."
 *
 * Falls back to DEFAULT_ACTION_PRICE_USDC / a literal "0.15" only when no
 * PlatformSetting row exists yet (e.g. a fresh DB before seeding) or when no
 * DB is reachable (e.g. unit tests) — this fallback exists for local dev
 * resilience, not as the source of truth.
 */
export async function resolveDefaultPrice(
  _actionType: ActionType,
): Promise<string> {
  try {
    const setting = await getDb().platformSetting.findUnique({
      where: { key: DEFAULT_PRICE_SETTING_KEY },
    });
    if (setting) return setting.value;
  } catch {
    // DB not reachable — fall through to the env/literal fallback below.
  }
  return process.env.DEFAULT_ACTION_PRICE_USDC ?? "0.15";
}

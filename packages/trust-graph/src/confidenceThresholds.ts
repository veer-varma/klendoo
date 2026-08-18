import { getDb } from "@klendoo/db";

const AUTO_THRESHOLD_KEY = "confidence_auto_threshold";
const CONFIRM_THRESHOLD_KEY = "confidence_confirm_threshold";

const DEFAULT_AUTO_THRESHOLD = 0.8;
const DEFAULT_CONFIRM_THRESHOLD = 0.5;

export type ConfidenceBand = "auto" | "confirm" | "manual";

/**
 * The Trust Graph Spec's own thresholds (0.8 auto-act, 0.5 propose-and-
 * confirm, below that fully manual) — reusing PlatformSetting, exactly as
 * the spec names it, rather than hardcoding: "This threshold is an
 * assumption, not a decided policy — confirm before it ships... Recommend
 * validating against real Agent 1 approval data." Configurable so that
 * validation can actually happen without a code change.
 */
export async function getConfidenceThresholds(): Promise<{ auto: number; confirm: number }> {
  const db = getDb();
  try {
    const [autoSetting, confirmSetting] = await Promise.all([
      db.platformSetting.findUnique({ where: { key: AUTO_THRESHOLD_KEY } }),
      db.platformSetting.findUnique({ where: { key: CONFIRM_THRESHOLD_KEY } }),
    ]);
    return {
      auto: autoSetting ? Number(autoSetting.value) : DEFAULT_AUTO_THRESHOLD,
      confirm: confirmSetting ? Number(confirmSetting.value) : DEFAULT_CONFIRM_THRESHOLD,
    };
  } catch {
    // DB not reachable — same local-dev fallback reasoning as resolveDefaultPrice.
    return { auto: DEFAULT_AUTO_THRESHOLD, confirm: DEFAULT_CONFIRM_THRESHOLD };
  }
}

/**
 * Classifies a score against the current thresholds. Nothing in this
 * codebase calls this to actually gate agent behavior yet — see
 * packages/trust-graph/README.md for why that's deliberate, not missing.
 */
export async function classifyConfidence(score: number): Promise<ConfidenceBand> {
  const { auto, confirm } = await getConfidenceThresholds();
  if (score >= auto) return "auto";
  if (score >= confirm) return "confirm";
  return "manual";
}

/**
 * confidenceScore = 0.4×repeat_usage + 0.3×calendar_conflict_certainty
 *                 + 0.2×response_reliability + 0.1×recency
 *
 * Weights and formula are the Trust Graph Spec §1's own words, copied
 * exactly — "Weights are a starting assumption, not a validated model —
 * expect to tune once Agent 1/3 usage data exists." Not revalidated here;
 * this is the same unproven starting point the spec describes, wired up
 * so it CAN be validated once real usage exists, not a claim that it
 * already has been.
 */
export interface ConfidenceFactors {
  /** 0–1. Derivable today from real TrustEdge.usageCount — see deriveRepeatUsageFactor. */
  repeatUsageFactor: number;
  /**
   * 0–1. No real signal source exists yet — this needs live calendar data,
   * and Google Calendar integration is explicitly deferred post-launch
   * (see BACKLOG.md). Pass 0.5 (neutral) until a real source exists;
   * don't fabricate a computation for a signal that isn't real yet.
   */
  calendarConflictCertainty: number;
  /**
   * 0–1. No real signal source exists yet either — nothing in this
   * codebase currently tracks whether an invitee reliably responds/shows
   * up. Pass 0.5 (neutral) until Layer 2 relationship tracking exists.
   */
  responseReliability: number;
  /** 0–1. Derivable today from real TrustEdge.lastUsedAt — see deriveRecencyFactor. */
  recencyFactor: number;
}

const WEIGHTS = {
  repeatUsage: 0.4,
  calendarConflict: 0.3,
  responseReliability: 0.2,
  recency: 0.1,
} as const;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function computeConfidence(factors: ConfidenceFactors): number {
  const score =
    WEIGHTS.repeatUsage * clamp01(factors.repeatUsageFactor) +
    WEIGHTS.calendarConflict * clamp01(factors.calendarConflictCertainty) +
    WEIGHTS.responseReliability * clamp01(factors.responseReliability) +
    WEIGHTS.recency * clamp01(factors.recencyFactor);

  return clamp01(score);
}

/**
 * Saturating curve, not linear — a 6th repeat interaction shouldn't matter
 * as much as the 2nd. Reaches 1.0 at 5 uses. This specific curve/threshold
 * is this codebase's own choice, not something the spec pins down; revisit
 * once real usageCount distributions exist to look at.
 */
export function deriveRepeatUsageFactor(usageCount: number): number {
  const SATURATION_POINT = 5;
  return clamp01(usageCount / SATURATION_POINT);
}

/**
 * Linear decay to 0 over 90 days since last use. Never used (null) scores 0.
 * Same caveat as deriveRepeatUsageFactor — a starting heuristic, not tuned
 * against real data yet.
 */
export function deriveRecencyFactor(lastUsedAt: Date | null, now: Date = new Date()): number {
  if (!lastUsedAt) return 0;
  const DECAY_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;
  const elapsed = now.getTime() - lastUsedAt.getTime();
  if (elapsed < 0) return 1; // clock skew guard — don't score a future timestamp as "stale"
  return clamp01(1 - elapsed / DECAY_WINDOW_MS);
}

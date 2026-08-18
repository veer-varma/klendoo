export interface MajoritySlot {
  id: string;
  startTime: string; // ISO 8601
}

export interface MajorityResponse {
  slotId: string;
  available: boolean;
}

export interface MajorityResult {
  winningSlotId: string;
  /** Invitee-level availability count for the winning slot, not a fraction —
   * callers combine this with total invitee count if they need a percentage. */
  availableCount: number;
}

/**
 * Majority of *responders* who marked a slot available — not all invited
 * (waiting for every invitee to answer before deciding isn't realistic).
 * Ties go to the earliest slot. Both are explicit product decisions from
 * Veer (2026-08-17), not defaults this function invented.
 *
 * Returns null if nobody marked any slot available at all — that's a "no
 * consensus" poll, not a slot with a majority of zero.
 */
export function computeMajoritySlot(
  slots: MajoritySlot[],
  responses: MajorityResponse[],
): MajorityResult | null {
  const counts = new Map<string, number>();
  for (const slot of slots) counts.set(slot.id, 0);

  for (const response of responses) {
    if (!response.available) continue;
    if (!counts.has(response.slotId)) continue; // defensive: ignore stale/unknown slot ids
    counts.set(response.slotId, (counts.get(response.slotId) ?? 0) + 1);
  }

  const maxCount = Math.max(0, ...counts.values());
  if (maxCount === 0) return null;

  const tied = slots.filter((s) => counts.get(s.id) === maxCount);
  const earliest = tied.reduce((earliest, s) =>
    new Date(s.startTime) < new Date(earliest.startTime) ? s : earliest,
  );

  return { winningSlotId: earliest.id, availableCount: maxCount };
}

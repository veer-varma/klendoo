import { getDb } from "@klendoo/db";
import type { TrustEdge } from "@klendoo/db";

export async function revokeTrustEdge(edgeId: string, reason: string): Promise<TrustEdge> {
  return getDb().trustEdge.update({
    where: { id: edgeId },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
}

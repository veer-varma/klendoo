import { getDb } from "@klendoo/db";
import type { TrustEdge } from "@klendoo/db";
import type { TrustActionType } from "./types.js";

export async function getTrustEdge(
  fromId: string,
  toId: string,
  actionType: TrustActionType,
): Promise<TrustEdge | null> {
  return getDb().trustEdge.findUnique({
    where: { fromId_toId_actionType: { fromId, toId, actionType } },
  });
}

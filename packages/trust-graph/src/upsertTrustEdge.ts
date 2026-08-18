import { getDb } from "@klendoo/db";
import type { TrustEdge } from "@klendoo/db";
import type { TrustActionType, TrustEdgeKind } from "./types.js";

export interface UpsertTrustEdgeInput {
  fromId: string;
  toId: string;
  edgeType: TrustEdgeKind;
  actionType: TrustActionType;
  confidenceScore?: number;
  reasoning?: string;
}

/**
 * Creates the edge if it doesn't exist yet, or updates confidenceScore/
 * reasoning/edgeType on an existing one. Does NOT touch usageCount/
 * lastUsedAt — that's recordEdgeUsage's job, kept separate so "I recomputed
 * a confidence score" and "this edge was just exercised" stay distinct
 * operations with distinct call sites.
 */
export async function upsertTrustEdge(input: UpsertTrustEdgeInput): Promise<TrustEdge> {
  return getDb().trustEdge.upsert({
    where: {
      fromId_toId_actionType: {
        fromId: input.fromId,
        toId: input.toId,
        actionType: input.actionType,
      },
    },
    create: {
      fromId: input.fromId,
      toId: input.toId,
      edgeType: input.edgeType,
      actionType: input.actionType,
      confidenceScore: input.confidenceScore ?? 0,
      reasoning: input.reasoning,
    },
    update: {
      edgeType: input.edgeType,
      ...(input.confidenceScore !== undefined ? { confidenceScore: input.confidenceScore } : {}),
      ...(input.reasoning !== undefined ? { reasoning: input.reasoning } : {}),
    },
  });
}

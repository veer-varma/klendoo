import { getDb } from "@klendoo/db";
import type { TrustEdge } from "@klendoo/db";
import type { TrustActionType, TrustEdgeKind } from "./types.js";

export interface RecordEdgeUsageInput {
  fromId: string;
  toId: string;
  edgeType: TrustEdgeKind;
  actionType: TrustActionType;
  /** Free-form provenance for a first-time edge — e.g. "first reminder sent". */
  reasoning?: string;
}

/**
 * The Agent 1/3 "hardening" step from the Trust Graph Spec's build order:
 * every real action an agent completes writes/increments a TrustEdge, so
 * confidence scoring eventually has real repeat-interaction data to derive
 * from instead of nothing. Creates the edge on first use (usageCount 1)
 * rather than requiring a separate upsertTrustEdge call first.
 */
export async function recordEdgeUsage(input: RecordEdgeUsageInput): Promise<TrustEdge> {
  const db = getDb();
  const now = new Date();

  return db.trustEdge.upsert({
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
      usageCount: 1,
      lastUsedAt: now,
      reasoning: input.reasoning,
    },
    update: {
      usageCount: { increment: 1 },
      lastUsedAt: now,
    },
  });
}

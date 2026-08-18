/**
 * Mirrors ActionType in @klendoo/payment-core — kept as a separate literal
 * union here rather than importing it, so trust-graph doesn't depend on
 * payment-core for one shared vocabulary word (avoids a cross-package
 * dependency neither side otherwise needs).
 */
export type TrustActionType = "booking" | "negotiation" | "followup" | "reminder" | "spend";

export type TrustEdgeKind = "APPROVAL" | "RELATIONSHIP" | "AUTONOMY";

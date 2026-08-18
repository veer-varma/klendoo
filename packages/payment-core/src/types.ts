/**
 * Mirrors TrustEdge.actionType from Klendoo_Product_Definition_Trust_Graph_Spec.md §1
 * so payment-core and the future trust-graph package share one vocabulary.
 * Also used as the `extra.actionType` tag on a route's PaymentOption so the
 * shared settlement hooks (see paidResource.ts) know what to log.
 */
export type ActionType =
  | "booking"
  | "negotiation"
  | "followup"
  | "reminder"
  | "spend";

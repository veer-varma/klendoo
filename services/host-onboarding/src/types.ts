export interface RegisterHostInput {
  businessName: string;
  email: string;
  slug: string;
  /** References Plan.key, e.g. "starter" or "entrepreneur" — not a hardcoded enum. */
  planKey: string;
}

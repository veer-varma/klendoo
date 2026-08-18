/**
 * Single source of truth for Klendoo's merchant identity on x402/Bazaar —
 * every paid route (Reminder, Negotiation, future agents) spreads this into
 * its `extensions["x402-merchant"]` so the metadata is consistent
 * everywhere instead of copy-pasted per service.
 */
export const KLENDOO_MERCHANT_INFO = {
  name: "Klendoo",
  website: "https://klendoo.com",
  logo: "https://klendoo.com/logo.png",
  categories: ["scheduling", "calendar", "algorand", "x402"],
};

const MERCHANT_INFO_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string" },
    website: { type: "string" },
    logo: { type: "string" },
    categories: { type: "array", items: { type: "string" } },
  },
};

/**
 * Spread this into a route's `extensions` alongside declareDiscoveryExtension()
 * — matches the shape the official @x402/express example uses.
 */
export function merchantExtension(): Record<string, unknown> {
  return {
    "x402-merchant": {
      info: KLENDOO_MERCHANT_INFO,
      schema: MERCHANT_INFO_SCHEMA,
    },
  };
}

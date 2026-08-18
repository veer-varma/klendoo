import type { BookingContext } from "./types.js";

/**
 * Every BookingContext field is a plain string, so it round-trips through a
 * query string with no coercion needed. This exists because the paid
 * endpoint has to be GET with no body — see server.ts/cli.ts for why.
 */
const FIELDS = [
  "contextRef",
  "hostName",
  "hostEmail",
  "visitorName",
  "visitorEmail",
  "meetingTitle",
  "meetingTime",
] as const satisfies readonly (keyof BookingContext)[];

export function contextToQueryString(context: BookingContext): string {
  const params = new URLSearchParams();
  for (const field of FIELDS) params.set(field, context[field]);
  return params.toString();
}

export function contextFromQuery(query: Record<string, unknown>): BookingContext {
  const get = (field: keyof BookingContext): string => {
    const value = query[field];
    if (typeof value === "string" && value.length > 0) return value;
    throw new Error(`Missing or invalid query param: ${field}`);
  };
  return {
    contextRef: get("contextRef"),
    hostName: get("hostName"),
    hostEmail: get("hostEmail"),
    visitorName: get("visitorName"),
    visitorEmail: get("visitorEmail"),
    meetingTitle: get("meetingTitle"),
    meetingTime: get("meetingTime"),
  };
}

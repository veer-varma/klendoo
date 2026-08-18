import { getDb } from "@klendoo/db";

export interface BusyBlock {
  startTime: Date;
  endTime: Date;
}

export interface PublicCalendarResult {
  businessName: string;
  busyBlocks: BusyBlock[];
}

const LOOKAHEAD_DAYS = 60;

/**
 * Returns busy/free data for a host's publicly shareable calendar — per
 * Veer's explicit answer ("Busy/free only") when asked how much to expose:
 * no meeting titles, no attendee names or emails, just that a block of time
 * is taken. Only confirmed `CalendarEvent` rows count as busy — a DRAFT or
 * still-OPEN poll isn't a real commitment yet, so it doesn't block time on
 * the public page.
 *
 * Returns null if the slug doesn't match an APPROVED host — a PENDING or
 * REJECTED host (or a typo'd slug) gets a 404, not a page revealing the
 * business exists and is unapproved.
 */
export async function getPublicCalendar(slug: string): Promise<PublicCalendarResult | null> {
  const db = getDb();
  const host = await db.hostAccount.findUnique({ where: { slug } });
  if (!host || host.status !== "APPROVED") {
    return null;
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);

  const events = await db.calendarEvent.findMany({
    where: { hostEmail: host.email, startTime: { gte: now, lte: windowEnd } },
    orderBy: { startTime: "asc" },
  });

  return {
    businessName: host.businessName,
    busyBlocks: events.map((e) => ({ startTime: e.startTime, endTime: e.endTime })),
  };
}

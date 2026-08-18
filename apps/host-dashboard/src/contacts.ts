import { getDb } from "@klendoo/db";
import type { Contact } from "@klendoo/db";

export class InvalidContactError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidContactError";
  }
}

export function listContacts(hostId: string): Promise<Contact[]> {
  return getDb().contact.findMany({ where: { hostId }, orderBy: { name: "asc" } });
}

export async function addContact(hostId: string, name: string, phone: string): Promise<Contact> {
  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  if (!trimmedName) throw new InvalidContactError("Name is required.");
  if (!trimmedPhone) throw new InvalidContactError("Phone number is required.");

  return getDb().contact.upsert({
    where: { hostId_phone: { hostId, phone: trimmedPhone } },
    create: { hostId, name: trimmedName, phone: trimmedPhone },
    update: { name: trimmedName },
  });
}

export interface ImportResult {
  created: number;
  skipped: number;
}

/**
 * Bulk import from pasted text — one contact per line, "Name, Phone" or
 * "Name<TAB>Phone" (so a copy-paste out of a spreadsheet's two columns
 * works without reformatting). Lines that don't split into exactly a name
 * and a phone are skipped, not fatal — one bad line in a pasted list of 50
 * shouldn't lose the other 49.
 */
export async function importContacts(hostId: string, rawText: string): Promise<ImportResult> {
  const db = getDb();
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const rows: { name: string; phone: string }[] = [];
  let skipped = 0;

  for (const line of lines) {
    const parts = line.split(/\t|,/).map((p) => p.trim()).filter(Boolean);
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      skipped += 1;
      continue;
    }
    rows.push({ name: parts[0], phone: parts[1] });
  }

  if (rows.length === 0) {
    return { created: 0, skipped };
  }

  const result = await db.contact.createMany({
    data: rows.map((r) => ({ hostId, name: r.name, phone: r.phone })),
    skipDuplicates: true,
  });

  return { created: result.count, skipped: skipped + (rows.length - result.count) };
}

export async function deleteContact(hostId: string, contactId: string): Promise<void> {
  const db = getDb();
  const contact = await db.contact.findUnique({ where: { id: contactId } });
  if (!contact || contact.hostId !== hostId) {
    // Ownership check — a host guessing another host's contact id should
    // see nothing happen, not a 500 or (worse) delete someone else's data.
    return;
  }
  await db.contact.delete({ where: { id: contactId } });
}

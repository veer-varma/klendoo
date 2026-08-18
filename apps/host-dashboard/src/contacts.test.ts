import { describe, expect, it, vi, beforeEach } from "vitest";

interface ContactRow {
  id: string;
  hostId: string;
  name: string;
  phone: string;
}

let contacts: ContactRow[] = [];
let idCounter = 0;

vi.mock("@klendoo/db", () => ({
  getDb: () => ({
    contact: {
      findMany: vi.fn(async ({ where }: { where: { hostId: string } }) =>
        contacts.filter((c) => c.hostId === where.hostId).sort((a, b) => a.name.localeCompare(b.name)),
      ),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { hostId_phone: { hostId: string; phone: string } };
          create: { hostId: string; name: string; phone: string };
          update: { name: string };
        }) => {
          const existing = contacts.find(
            (c) => c.hostId === where.hostId_phone.hostId && c.phone === where.hostId_phone.phone,
          );
          if (existing) {
            existing.name = update.name;
            return existing;
          }
          idCounter += 1;
          const row: ContactRow = { id: `contact-${idCounter}`, ...create };
          contacts.push(row);
          return row;
        },
      ),
      createMany: vi.fn(
        async ({
          data,
          skipDuplicates,
        }: {
          data: { hostId: string; name: string; phone: string }[];
          skipDuplicates?: boolean;
        }) => {
          let count = 0;
          for (const row of data) {
            const exists = contacts.some((c) => c.hostId === row.hostId && c.phone === row.phone);
            if (exists && skipDuplicates) continue;
            idCounter += 1;
            contacts.push({ id: `contact-${idCounter}`, ...row });
            count += 1;
          }
          return { count };
        },
      ),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => contacts.find((c) => c.id === where.id) ?? null),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        contacts = contacts.filter((c) => c.id !== where.id);
      }),
    },
  }),
}));

const { listContacts, addContact, importContacts, deleteContact, InvalidContactError } = await import(
  "./contacts.js"
);

beforeEach(() => {
  contacts = [];
  idCounter = 0;
});

describe("addContact", () => {
  it("creates a contact for the host", async () => {
    const contact = await addContact("host-1", "Priya Shah", "+1 555-0100");
    expect(contact.name).toBe("Priya Shah");
    expect(contact.phone).toBe("+1 555-0100");
  });

  it("rejects an empty name", async () => {
    await expect(addContact("host-1", "  ", "+1 555-0100")).rejects.toThrow(InvalidContactError);
  });

  it("rejects an empty phone", async () => {
    await expect(addContact("host-1", "Priya Shah", "  ")).rejects.toThrow(InvalidContactError);
  });

  it("updates the name if the same phone is re-added for the same host", async () => {
    await addContact("host-1", "Priya", "+1 555-0100");
    const updated = await addContact("host-1", "Priya Shah", "+1 555-0100");
    expect(updated.name).toBe("Priya Shah");
    expect((await listContacts("host-1"))).toHaveLength(1);
  });
});

describe("importContacts", () => {
  it("imports comma-separated name,phone lines", async () => {
    const result = await importContacts("host-1", "Priya Shah, +1 555-0100\nAlex Kim, +1 555-0101");
    expect(result).toEqual({ created: 2, skipped: 0 });
    expect(await listContacts("host-1")).toHaveLength(2);
  });

  it("imports tab-separated lines", async () => {
    const result = await importContacts("host-1", "Priya Shah\t+1 555-0100");
    expect(result.created).toBe(1);
  });

  it("skips malformed lines without failing the whole import", async () => {
    const result = await importContacts("host-1", "Priya Shah, +1 555-0100\njust one field\n\nAlex Kim, +1 555-0101");
    expect(result).toEqual({ created: 2, skipped: 1 });
  });

  it("skips duplicates against existing contacts for the same host", async () => {
    await addContact("host-1", "Priya", "+1 555-0100");
    const result = await importContacts("host-1", "Priya Shah, +1 555-0100\nAlex Kim, +1 555-0101");
    expect(result).toEqual({ created: 1, skipped: 1 });
  });

  it("returns all-skipped for empty input", async () => {
    const result = await importContacts("host-1", "\n\n  \n");
    expect(result).toEqual({ created: 0, skipped: 0 });
  });
});

describe("deleteContact", () => {
  it("deletes a contact owned by the host", async () => {
    const contact = await addContact("host-1", "Priya", "+1 555-0100");
    await deleteContact("host-1", contact.id);
    expect(await listContacts("host-1")).toHaveLength(0);
  });

  it("does nothing if the contact belongs to a different host", async () => {
    const contact = await addContact("host-1", "Priya", "+1 555-0100");
    await deleteContact("host-2", contact.id);
    expect(await listContacts("host-1")).toHaveLength(1);
  });
});

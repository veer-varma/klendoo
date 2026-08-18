export interface ResponseFormSlot {
  id: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
}

export interface ResponseFormInput {
  pollTitle: string;
  hostName: string;
  deadline: string; // ISO 8601
  inviteeName: string;
  slots: ResponseFormSlot[];
  /** Slot ids this invitee already marked available, if re-visiting. */
  existingAvailable?: string[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatSlot(startTime: string): string {
  return new Date(startTime).toUTCString();
}

/**
 * Pure — no I/O — renders the page an invitee lands on to mark availability
 * per candidate slot. Posts back to the same token URL (see server.ts).
 */
export function renderResponseForm(input: ResponseFormInput): string {
  const existing = new Set(input.existingAvailable ?? []);
  const slotRows = input.slots
    .map(
      (s) => `
      <label class="slot">
        <input type="checkbox" name="slot_${escapeHtml(s.id)}" ${existing.has(s.id) ? "checked" : ""}>
        ${escapeHtml(formatSlot(s.startTime))}
      </label>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Klendoo — ${escapeHtml(input.pollTitle)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 2rem auto; padding: 0 1rem; }
    .slot { display: block; padding: 0.6rem 0; border-bottom: 1px solid #ddd; }
    button { margin-top: 1.2rem; padding: 0.6rem 1.2rem; }
  </style>
</head>
<body>
  <h1>${escapeHtml(input.pollTitle)}</h1>
  <p>${escapeHtml(input.hostName)} wants to find a time. Hi ${escapeHtml(input.inviteeName)} — check every time that works for you, then submit. Respond by ${escapeHtml(new Date(input.deadline).toUTCString())}.</p>
  <form method="post">
    ${slotRows}
    <button type="submit">Submit availability</button>
  </form>
</body>
</html>
`;
}

export function renderResponseThanks(pollTitle: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Klendoo — Thanks</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 2rem auto; padding: 0 1rem;">
  <h1>Got it</h1>
  <p>Thanks — your availability for "${escapeHtml(pollTitle)}" is recorded. We'll follow up once a time is confirmed.</p>
</body>
</html>
`;
}

import { escapeHtml } from "./layout.js";

function shell(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Klendoo — ${escapeHtml(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; background: #f5f6f8; color: #14171f; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #fff; border: 1px solid #dee1e9; border-radius: 12px; padding: 32px; width: 340px; }
    .wordmark { font-weight: 700; font-size: 19px; margin-bottom: 6px; }
    .wordmark .mint { color: #14a37e; }
    p { font-size: 13.5px; color: #5b6072; line-height: 1.5; }
    label { display: block; font-size: 12.5px; font-weight: 600; color: #5b6072; margin: 12px 0 4px; }
    input[type="password"] { width: 100%; padding: 8px 10px; border: 1px solid #dee1e9; border-radius: 7px; font-size: 14px; box-sizing: border-box; }
    button { width: 100%; margin-top: 16px; padding: 9px; border-radius: 7px; border: none; background: #5b3fc4; color: #fff; font-weight: 600; font-size: 14px; cursor: pointer; }
    .error { color: #a23b27; font-size: 12.5px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="wordmark">klend<span class="mint">oo</span></div>
    ${body}
  </div>
</body>
</html>
`;
}

/**
 * Shown once, right after a host's first successful magic-link sign-in
 * (Sprint 7a — Veer: "most users will login with their password after the
 * first magic link interface"). Enforced server-side, not just offered:
 * every protected route redirects here until a password is set — see
 * server.ts's requireHostSessionWithPassword.
 */
export function renderSetPasswordPage(error?: string): string {
  return shell(
    "Set your password",
    `
    <p>You're in! Set a password so you can sign in directly next time, instead of requesting a new link each time.</p>
    ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
    <form method="post" action="/set-password">
      <label for="password">New password</label>
      <input type="password" id="password" name="password" minlength="8" required autofocus>
      <label for="confirmPassword">Confirm password</label>
      <input type="password" id="confirmPassword" name="confirmPassword" minlength="8" required>
      <button type="submit">Set password</button>
    </form>
  `,
  );
}

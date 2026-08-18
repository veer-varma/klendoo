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
    input[type="email"] { width: 100%; padding: 8px 10px; border: 1px solid #dee1e9; border-radius: 7px; font-size: 14px; margin: 14px 0 12px; box-sizing: border-box; }
    button { width: 100%; padding: 9px; border-radius: 7px; border: none; background: #5b3fc4; color: #fff; font-weight: 600; font-size: 14px; cursor: pointer; }
    .error { color: #a23b27; font-size: 12.5px; margin-top: 10px; }
    .success { color: #14a37e; font-size: 13px; }
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

export function renderLoginPage(): string {
  return shell(
    "Sign in",
    `
    <p>Enter your host account email and we'll send you a one-time sign-in link.</p>
    <form method="post" action="/login">
      <input type="email" name="email" placeholder="you@yourbusiness.com" autofocus required>
      <button type="submit">Send sign-in link</button>
    </form>
  `,
  );
}

export function renderLinkSentPage(): string {
  return shell(
    "Check your email",
    `
    <p class="success">If that email matches an approved host account, a sign-in link is on its way — it expires in 15 minutes.</p>
    <p><a href="/login">Back to sign in</a></p>
  `,
  );
}

export function renderVerifyFailedPage(message: string): string {
  return shell(
    "Sign-in link expired",
    `
    <p class="error">${escapeHtml(message)}</p>
    <p><a href="/login">Request a new link</a></p>
  `,
  );
}

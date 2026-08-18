import { escapeHtml } from "./layout.js";

export function renderLoginPage(error?: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Klendoo Admin — Log in</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; background: #f5f6f8; color: #14171f; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #fff; border: 1px solid #dee1e9; border-radius: 12px; padding: 32px; width: 300px; }
    .wordmark { font-weight: 700; font-size: 19px; margin-bottom: 18px; }
    .wordmark .mint { color: #14a37e; }
    input[type="password"] { width: 100%; padding: 8px 10px; border: 1px solid #dee1e9; border-radius: 7px; font-size: 14px; margin-bottom: 12px; box-sizing: border-box; }
    button { width: 100%; padding: 9px; border-radius: 7px; border: none; background: #5b3fc4; color: #fff; font-weight: 600; font-size: 14px; cursor: pointer; }
    .error { color: #a23b27; font-size: 12.5px; margin-bottom: 12px; }
  </style>
</head>
<body>
  <form class="card" method="post" action="/admin/login">
    <div class="wordmark">klend<span class="mint">oo</span> admin</div>
    ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
    <input type="password" name="password" placeholder="Admin password" autofocus required>
    <button type="submit">Log in</button>
  </form>
</body>
</html>
`;
}

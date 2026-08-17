#!/usr/bin/env node
// Secret-scanning guard for staged files — Klendoo_Sprint_Plan.md ground rules:
// "Claude Code's first commit in Sprint 0 must include a secret-scanning
// pre-commit hook (gitleaks or equivalent) that fails the commit if it
// detects a likely key/token. This isn't optional or deferrable."
//
// Dependency-free by design (no gitleaks binary required locally) so the hook
// works the same on every contributor's machine and in CI. See
// .github/workflows/secret-scan.yml for the belt-and-suspenders gitleaks pass
// on push/PR, which catches anything a regex here misses.

import { execSync } from "node:child_process";

const ALLOWLISTED_PATHS = new Set([".env.example", "scripts/scan-secrets.js"]);

// Patterns for common credential shapes. Deliberately conservative (few false
// positives) rather than exhaustive — this is a fast local guard, not the
// only line of defense.
const PATTERNS = [
  { name: "AWS access key ID", re: /AKIA[0-9A-Z]{16}/ },
  { name: "generic API key/secret assignment", re: /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][A-Za-z0-9\-_./+=]{16,}["']/i },
  { name: "PEM private key block", re: /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/ },
  { name: "possible JWT", re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  // Algorand mnemonics are 25 lowercase words — flag long runs of them so a
  // pasted ALGOD_TESTNET_MNEMONIC value doesn't slip into a commit.
  { name: "possible Algorand mnemonic (25-word phrase)", re: /(?:\b[a-z]+\b[ \t]+){24}\b[a-z]+\b/ },
];

function stagedFiles() {
  const out = execSync("git diff --cached --name-only --diff-filter=ACM", {
    encoding: "utf8",
  });
  return out.split("\n").filter(Boolean);
}

function fileContent(path) {
  try {
    return execSync(`git show :${JSON.stringify(path).slice(1, -1)}`, {
      encoding: "utf8",
    });
  } catch {
    return "";
  }
}

let found = false;

for (const path of stagedFiles()) {
  if (ALLOWLISTED_PATHS.has(path)) continue;
  if (path.endsWith(".env") || /\.env\.[^.]+$/.test(path)) {
    console.error(`✖ scan-secrets: ${path} looks like an env file with real values — do not commit it.`);
    found = true;
    continue;
  }

  const content = fileContent(path);
  for (const { name, re } of PATTERNS) {
    if (re.test(content)) {
      console.error(`✖ scan-secrets: ${path} matches pattern "${name}" — looks like a committed secret.`);
      found = true;
    }
  }
}

if (found) {
  console.error(
    "\nCommit blocked. If this is a false positive, adjust scripts/scan-secrets.js " +
      "rather than bypassing with --no-verify.",
  );
  process.exit(1);
}

process.exit(0);

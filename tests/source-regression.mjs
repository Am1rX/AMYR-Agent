#!/usr/bin/env node
/** Check the exact tracked tree before publishing a self-hosted instance. */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const forbiddenFiles = new Set(["wrangler.toml", ".env", ".dev.vars"]);
const patterns = [
  ["Telegram bot token", /\b\d{8,12}:AA[A-Za-z0-9_-]{30,}\b/],
  ["Google API key", /AIza[A-Za-z0-9_-]{30,}/],
  ["Cloudflare API token", /\bcfat_[A-Za-z0-9_-]{20,}\b/],
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["D1 database ID", /^database_id\s*=\s*"[0-9a-f]{8}-[0-9a-f-]{27,}"/im],
  ["numeric owner ID", /^BOT_OWNER_ID\s*=\s*"\d{7,}"/im],
];
const violations = [];
for (const path of tracked) {
  if (forbiddenFiles.has(path)) violations.push(`${path}: deployment-specific file is tracked`);
  if (!/\.(?:ts|js|mjs|html|txt|toml|json|md|yml|yaml|css|svg)$/i.test(path)) continue;
  const content = readFileSync(path, "utf8");
  for (const [label, pattern] of patterns) {
    if (pattern.test(content)) violations.push(`${path}: possible ${label}`);
  }
}
if (violations.length) {
  for (const violation of violations) console.error(violation);
  process.exit(1);
}
console.log(`Secret and deployment-config guard passed (${tracked.length} tracked files).`);

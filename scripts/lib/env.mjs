// Minimal .env.local loader for standalone scripts (Next.js loads .env.local
// automatically for the app itself, but plain `node scripts/foo.mjs` doesn't).
// No dependency — just enough to read KEY=value lines.
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadEnvLocal() {
  let content;
  try {
    content = await readFile(path.join(process.cwd(), ".env.local"), "utf-8");
  } catch {
    return;
  }
  for (const line of content.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = (match[2] ?? "").trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

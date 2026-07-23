#!/usr/bin/env node
// Records today's real index values into data/history/<type>-<id>.json.
// Run manually (`node scripts/snapshot.mjs`) or on a schedule via
// .github/workflows/snapshot.yml. Safe to run more than once a day — it
// overwrites today's entry instead of duplicating it.
//
// Reads data/index-manifest.json (written by scripts/generate-cards.mjs) to
// know which real card ids belong to each index, fetches live TCGPlayer
// near-mint prices for those exact cards from pokemontcg.io, and averages
// them. An index is skipped (not backfilled with a guess) for any day where
// fewer than half its cards get a live price.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvLocal } from "./lib/env.mjs";

const BASE = "https://api.pokemontcg.io/v2";
const HISTORY_DIR = path.join(process.cwd(), "data", "history");
const MANIFEST_PATH = path.join(process.cwd(), "data", "index-manifest.json");
const MIN_COVERAGE = 0.5;

const PRICE_VARIANT_PRIORITY = [
  "normal",
  "holofoil",
  "reverseHolofoil",
  "1stEditionHolofoil",
  "1stEditionNormal",
  "unlimited",
  "unlimitedHolofoil",
];

function nearMintMarketPrice(card) {
  const prices = card.tcgplayer?.prices;
  if (!prices) return null;
  for (const variant of PRICE_VARIANT_PRIORITY) {
    const market = prices[variant]?.market;
    if (typeof market === "number" && market > 0) return market;
  }
  return null;
}

async function getJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const headers = { Accept: "application/json" };
    if (process.env.POKEMONTCG_API_KEY) headers["X-Api-Key"] = process.env.POKEMONTCG_API_KEY;
    const res = await fetch(url, { signal: controller.signal, headers });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPricesForSet(setId) {
  const prices = new Map();
  const res = await getJson(`${BASE}/cards?q=${encodeURIComponent(`set.id:${setId}`)}&pageSize=250`);
  for (const card of res.data ?? []) {
    const price = nearMintMarketPrice(card);
    if (price !== null) prices.set(card.id, price);
  }
  return prices;
}

async function appendSnapshot(indexId, value) {
  await mkdir(HISTORY_DIR, { recursive: true });
  const file = path.join(HISTORY_DIR, `${indexId}.json`);
  let history = [];
  try {
    history = JSON.parse(await readFile(file, "utf-8"));
  } catch {
    // no existing history yet
  }
  const today = new Date().toISOString().slice(0, 10);
  const rounded = Math.round(value * 100) / 100;
  const existingIdx = history.findIndex((p) => p.date === today);
  if (existingIdx >= 0) history[existingIdx] = { date: today, value: rounded };
  else history.push({ date: today, value: rounded });
  history.sort((a, b) => a.date.localeCompare(b.date));
  await writeFile(file, JSON.stringify(history, null, 2) + "\n");
}

async function main() {
  await loadEnvLocal();
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf-8"));

  const allSetIds = manifest.sets.map((s) => s.id);
  const priceMap = new Map();
  console.log(`Fetching live prices for ${allSetIds.length} sets...`);
  const results = await Promise.allSettled(allSetIds.map((id) => fetchPricesForSet(id)));
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      for (const [id, price] of result.value) priceMap.set(id, price);
    } else {
      console.warn(`fetch failed for set ${allSetIds[i]}: ${result.reason?.message}`);
    }
  });
  console.log(`Got live prices for ${priceMap.size} cards.`);

  let recorded = 0;
  let skipped = 0;
  for (const index of [...manifest.sets.map((s) => ({ ...s, kind: "set" })), ...manifest.pokemon.map((p) => ({ ...p, kind: "pokemon" }))]) {
    const prices = index.cardIds.map((id) => priceMap.get(id)).filter((p) => typeof p === "number");
    const coverage = index.cardIds.length ? prices.length / index.cardIds.length : 0;
    if (coverage < MIN_COVERAGE) {
      console.warn(`skip ${index.kind} ${index.id}: only ${prices.length}/${index.cardIds.length} cards priced`);
      skipped++;
      continue;
    }
    const value = prices.reduce((a, b) => a + b, 0) / prices.length;
    await appendSnapshot(`${index.kind}-${index.id}`, value);
    recorded++;
  }

  console.log(`snapshot done: ${recorded} recorded, ${skipped} skipped`);
  if (recorded === 0) process.exitCode = 1;
}

main();

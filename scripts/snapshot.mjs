#!/usr/bin/env node
// Records today's real index values into data/history/<type>-<id>.json.
// Run manually (`node scripts/snapshot.mjs`) or on a schedule via
// .github/workflows/snapshot.yml. Safe to run more than once a day — it
// overwrites today's entry instead of duplicating it. An index is skipped
// (not backfilled with a guess) for any day the live API can't be reached.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = "https://api.pokemontcg.io/v2";
const HISTORY_DIR = path.join(process.cwd(), "data", "history");
const MODERN_CUTOFF = "2020/01/01";

const SETS = [
  { id: "champions-path", name: "Champion's Path" },
  { id: "vivid-voltage", name: "Vivid Voltage" },
  { id: "evolving-skies", name: "Evolving Skies" },
  { id: "brilliant-stars", name: "Brilliant Stars" },
  { id: "lost-origin", name: "Lost Origin" },
  { id: "silver-tempest", name: "Silver Tempest" },
  { id: "paldea-evolved", name: "Paldea Evolved" },
  { id: "scarlet-violet-151", name: "Scarlet & Violet 151" },
  { id: "paradox-rift", name: "Paradox Rift" },
  { id: "temporal-forces", name: "Temporal Forces" },
  { id: "surging-sparks", name: "Surging Sparks" },
  { id: "prismatic-evolutions", name: "Prismatic Evolutions" },
];

const POKEMON = [
  { id: "charizard", name: "Charizard" },
  { id: "pikachu", name: "Pikachu" },
  { id: "umbreon", name: "Umbreon" },
  { id: "mew", name: "Mew" },
  { id: "mewtwo", name: "Mewtwo" },
  { id: "eevee", name: "Eevee" },
  { id: "rayquaza", name: "Rayquaza" },
  { id: "gengar", name: "Gengar" },
  { id: "lugia", name: "Lugia" },
  { id: "sylveon", name: "Sylveon" },
  { id: "gyarados", name: "Gyarados" },
  { id: "snorlax", name: "Snorlax" },
];

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
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function averagePriceForSet(name) {
  const setRes = await getJson(`${BASE}/sets?q=${encodeURIComponent(`name:"${name}"`)}`);
  const setId = setRes.data?.[0]?.id;
  if (!setId) return null;
  const cardsRes = await getJson(`${BASE}/cards?q=${encodeURIComponent(`set.id:${setId}`)}&pageSize=250`);
  const prices = (cardsRes.data ?? []).map(nearMintMarketPrice).filter((p) => typeof p === "number");
  if (prices.length === 0) return null;
  return prices.reduce((a, b) => a + b, 0) / prices.length;
}

async function averagePriceForPokemon(name) {
  const query = `name:"${name}" set.releaseDate:[${MODERN_CUTOFF} TO *]`;
  const cardsRes = await getJson(`${BASE}/cards?q=${encodeURIComponent(query)}&pageSize=250`);
  const prices = (cardsRes.data ?? []).map(nearMintMarketPrice).filter((p) => typeof p === "number");
  if (prices.length === 0) return null;
  return prices.reduce((a, b) => a + b, 0) / prices.length;
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
  let recorded = 0;
  let skipped = 0;
  for (const set of SETS) {
    try {
      const value = await averagePriceForSet(set.name);
      if (value === null) throw new Error("no priced cards returned");
      await appendSnapshot(`set-${set.id}`, value);
      recorded++;
    } catch (err) {
      console.warn(`skip set ${set.id}: ${err.message}`);
      skipped++;
    }
  }
  for (const pokemon of POKEMON) {
    try {
      const value = await averagePriceForPokemon(pokemon.name);
      if (value === null) throw new Error("no priced cards returned");
      await appendSnapshot(`pokemon-${pokemon.id}`, value);
      recorded++;
    } catch (err) {
      console.warn(`skip pokemon ${pokemon.id}: ${err.message}`);
      skipped++;
    }
  }
  console.log(`snapshot done: ${recorded} recorded, ${skipped} skipped`);
  if (recorded === 0) process.exitCode = 1;
}

main();

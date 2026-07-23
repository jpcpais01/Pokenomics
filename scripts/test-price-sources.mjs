#!/usr/bin/env node
// Quick standalone sanity check for the two live pricing sources, without
// running the whole app. Run: node scripts/test-price-sources.mjs
//
// Prints the raw API responses so you can eyeball whether they look right —
// this matters most for PriceCharting, whose exact response shape (field
// names for the "ungraded"/raw price) wasn't verified against the live API
// while building this (see src/lib/priceCharting.ts).

import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvLocal } from "./lib/env.mjs";

const SAMPLE_COUNT = 3;

async function loadSampleCards() {
  const src = await readFile(path.join(process.cwd(), "src", "lib", "fixtures.ts"), "utf-8");
  const marker = "export const FIXTURE_CARDS: Card[] = ";
  const start = src.indexOf(marker);
  if (start === -1) throw new Error("Couldn't find FIXTURE_CARDS in src/lib/fixtures.ts — run `npm run generate` first?");
  const json = src.slice(start + marker.length).replace(/;\s*$/, "");
  const cards = JSON.parse(json);

  const setsMarker = "export const SET_DEFS: SetDef[] = ";
  const setsStart = src.indexOf(setsMarker);
  const setsJson = src.slice(setsStart + setsMarker.length, src.indexOf("export const POKEMON_DEFS"));
  const sets = JSON.parse(setsJson.replace(/;\s*$/, "").trim());
  const setNameById = new Map(sets.map((s) => [s.id, s.name]));

  // Pick a spread of well-known, high-tier cards — easiest to sanity-check by eye.
  const sorted = [...cards].sort((a, b) => b.price - a.price);
  return sorted.slice(0, SAMPLE_COUNT).map((c) => ({ ...c, setName: setNameById.get(c.setId) ?? c.setId }));
}

async function testTcgplayer(card) {
  console.log(`\n--- TCGPlayer (pokemontcg.io) — ${card.name} #${card.number}, ${card.setName} ---`);
  if (!process.env.POKEMONTCG_API_KEY) {
    console.log("  (no POKEMONTCG_API_KEY set — trying unauthenticated, likely to be rate-limited)");
  }
  const headers = { Accept: "application/json" };
  if (process.env.POKEMONTCG_API_KEY) headers["X-Api-Key"] = process.env.POKEMONTCG_API_KEY;
  const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(`set.id:${card.setId}`)}&pageSize=250`;
  try {
    const res = await fetch(url, { headers });
    console.log(`  HTTP ${res.status} ${res.statusText}`);
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      console.log("  Non-JSON response:", text.slice(0, 300));
      return;
    }
    if (!res.ok) {
      console.log("  Response:", JSON.stringify(body).slice(0, 500));
      return;
    }
    const match = (body.data ?? []).find((c) => c.id === card.id);
    if (!match) {
      console.log(`  Card id "${card.id}" not found in this set's ${body.data?.length ?? 0} returned cards.`);
      return;
    }
    console.log("  Found. tcgplayer.prices:", JSON.stringify(match.tcgplayer?.prices ?? null));
  } catch (err) {
    console.log("  Request failed:", err instanceof Error ? err.message : err);
  }
}

async function testPriceCharting(card) {
  console.log(`\n--- PriceCharting — ${card.name} #${card.number}, ${card.setName} ---`);
  const token = process.env.PRICECHARTING_API_KEY;
  if (!token) {
    console.log("  (no PRICECHARTING_API_KEY set — skipping)");
    return;
  }
  const q = `${card.name} ${card.number} ${card.setName}`;
  const url = `https://www.pricecharting.com/api/products?t=${encodeURIComponent(token)}&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url);
    console.log(`  Query: "${q}"`);
    console.log(`  HTTP ${res.status} ${res.statusText}`);
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      console.log("  Non-JSON response:", text.slice(0, 300));
      return;
    }
    console.log("  Raw response (first 2 products):");
    console.log(
      JSON.stringify(
        { status: body.status, products: (body.products ?? []).slice(0, 2) },
        null,
        2
      )
    );
    console.log(
      "  If a product above is the right card but the price isn't showing in the app, tell me the exact field name that holds its raw/ungraded price and I'll fix src/lib/priceCharting.ts."
    );
  } catch (err) {
    console.log("  Request failed:", err instanceof Error ? err.message : err);
  }
}

async function main() {
  await loadEnvLocal();
  console.log(`POKEMONTCG_API_KEY: ${process.env.POKEMONTCG_API_KEY ? "set" : "not set"}`);
  console.log(`PRICECHARTING_API_KEY: ${process.env.PRICECHARTING_API_KEY ? "set" : "not set"}`);

  const samples = await loadSampleCards();
  for (const card of samples) {
    await testTcgplayer(card);
    await testPriceCharting(card);
  }
}

main();

#!/usr/bin/env node
// Regenerates src/lib/fixtures.ts from real Pokémon TCG data.
//
// Card identity (set, name, number, rarity) comes straight from
// PokemonTCG/pokemon-tcg-data on GitHub — the same open dataset that powers
// the pokemontcg.io API — so every card in the app is a card that actually
// exists. Prices are NOT in that dataset (it only tracks card identity, not
// market data), so prices here are a disclosed rarity-tier model; the app's
// live path (src/lib/pokeApi.ts) overlays real TCGPlayer prices on top of
// this same real roster whenever pokemontcg.io is reachable.
//
// Run: node scripts/generate-cards.mjs

import { writeFile } from "node:fs/promises";
import path from "node:path";

const RAW_BASE = "https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master";
const MODERN_CUTOFF = "2020/01/01";
const CHASE_TIER_MIN = 4;
const POKEMON_INDEX_COUNT = 16;
const MIN_CARDS_PER_POKEMON_INDEX = 4;

// Rough chase-worthiness ranking of every rarity string observed in the
// 2020+ era of the dataset. Anything not listed (Common/Uncommon/Rare/plain
// Rare Holo, and one-off oddities) defaults to 0 and is excluded.
const RARITY_TIER = {
  "Special Illustration Rare": 5,
  "Hyper Rare": 5,
  "Mega Hyper Rare": 5,
  "Rare Secret": 5,
  "Rare Rainbow": 5,
  "Shiny Ultra Rare": 5,
  "Black White Rare": 5,
  "Illustration Rare": 4,
  "Rare Holo VMAX": 4,
  "Rare Holo VSTAR": 4,
  "Ultra Rare": 4,
  "Rare Ultra": 4,
  "Double Rare": 4,
  "ACE SPEC Rare": 4,
  "Amazing Rare": 4,
  "Radiant Rare": 4,
  "Shiny Rare": 4,
  MEGA_ATTACK_RARE: 4,
  "Rare Holo V": 3,
  "Rare Holo": 3,
};

function tierOf(rarity) {
  return RARITY_TIER[rarity] ?? 0;
}

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "pokenomics-generate-cards" } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

function isMainModernSet(set) {
  if (set.releaseDate < MODERN_CUTOFF) return false;
  if (set.series === "Other") return false; // McDonald's, Futsal, etc. promo tie-ins
  if (set.id === "svp" || set.id === "sve") return false; // promo-only / energy-only mini sets
  if (/tg$/.test(set.id) || /gg$/.test(set.id) || /sv$/.test(set.id)) return false; // Trainer/Galarian Gallery, Shiny Vault subsets
  if (set.id === "cel25c") return false; // Celebrations Classic Collection subset (cel25 covers the set)
  if (set.total < 20) return false; // drop tiny promo sets
  return true;
}

/** Strips Mega/V/VMAX/VSTAR/ex/GX modifiers to get a stable species key, e.g. "Mega Charizard ex" -> "Charizard". */
function coreSpecies(name) {
  return name
    .replace(/^Mega /, "")
    .replace(/ (VMAX|VSTAR|V-UNION|V|GX|EX|ex|BREAK)$/, "")
    .trim();
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Deterministic seeded PRNG so regenerating with the same inputs reproduces the same prices.
function hashSeed(key) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussian(rng) {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const TIER_BASE_PRICE = { 5: 65, 4: 14, 3: 5 };

/** Rarity-tier price model: log-normal jitter (real chase-card prices are long-tailed) times a mild popularity boost. */
function modelPrice(cardId, tier, popularityCount) {
  const base = TIER_BASE_PRICE[tier] ?? 3;
  const rng = mulberry32(hashSeed(cardId));
  const jitter = Math.exp(gaussian(rng) * 0.55);
  const popularity = 1 + Math.min(1.6, popularityCount / 12);
  const price = base * jitter * popularity;
  return Math.max(1.5, Math.round(price * 100) / 100);
}

async function main() {
  console.log("Fetching set index...");
  const allSets = await getJson(`${RAW_BASE}/sets/en.json`);
  const mainSets = allSets.filter(isMainModernSet).sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
  console.log(`${mainSets.length} main modern sets`);

  const setCards = new Map();
  for (const set of mainSets) {
    const cards = await getJson(`${RAW_BASE}/cards/en/${set.id}.json`);
    setCards.set(set.id, cards);
    console.log(`  ${set.id}: ${cards.length} cards`);
  }

  // First pass: collect chase-tier Pokémon cards and species frequency.
  const chaseBySpecies = new Map(); // coreSpecies -> count
  const rawChase = []; // { setId, card, tier, species }
  for (const set of mainSets) {
    for (const card of setCards.get(set.id)) {
      if (card.supertype !== "Pokémon") continue;
      if (!card.nationalPokedexNumbers?.length) continue;
      const tier = tierOf(card.rarity);
      if (tier < CHASE_TIER_MIN) continue;
      const species = coreSpecies(card.name);
      chaseBySpecies.set(species, (chaseBySpecies.get(species) ?? 0) + 1);
      rawChase.push({ setId: set.id, card, tier, species });
    }
  }

  // Pick the Pokémon index roster from real chase-card frequency, not a hand list.
  const topSpecies = [...chaseBySpecies.entries()]
    .filter(([, count]) => count >= MIN_CARDS_PER_POKEMON_INDEX)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, POKEMON_INDEX_COUNT)
    .map(([species]) => species);
  const topSpeciesSet = new Set(topSpecies);

  console.log("\nPokémon indices (by real chase-card frequency):");
  for (const s of topSpecies) console.log(`  ${chaseBySpecies.get(s)}x ${s}`);

  // Build final card list: every chase card belongs to its set's basket; it
  // also carries a `pokemon` slug when its species made the index roster.
  const usedTickers = new Set();
  function tickerFor(name) {
    const base = name.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() || "PKMN";
    let ticker = base;
    let n = 1;
    while (usedTickers.has(ticker)) ticker = `${base}${++n}`;
    usedTickers.add(ticker);
    return ticker;
  }

  const cards = rawChase.map(({ setId, card, tier, species }) => ({
    id: card.id,
    name: card.name,
    pokemon: topSpeciesSet.has(species) ? slugify(species) : null,
    setId,
    number: card.number,
    rarity: card.rarity,
    price: modelPrice(card.id, tier, chaseBySpecies.get(species) ?? 0),
  }));

  const setDefs = mainSets.map((s) => ({
    id: s.id,
    name: s.name,
    series: s.series,
    ticker: s.ptcgoCode ?? tickerFor(s.name),
    releaseDate: s.releaseDate.replaceAll("/", "-"),
    totalCards: s.total,
  }));

  const pokemonDefs = topSpecies.map((species) => ({
    id: slugify(species),
    name: species,
    ticker: tickerFor(species),
  }));

  // Sanity: every set and every pokemon index should have a non-trivial basket.
  for (const s of setDefs) {
    const n = cards.filter((c) => c.setId === s.id).length;
    if (n === 0) console.warn(`WARNING: set ${s.id} has zero chase cards`);
  }
  for (const p of pokemonDefs) {
    const n = cards.filter((c) => c.pokemon === p.id).length;
    if (n < MIN_CARDS_PER_POKEMON_INDEX) console.warn(`WARNING: pokemon ${p.id} has only ${n} chase cards`);
  }

  const out = `// AUTO-GENERATED by scripts/generate-cards.mjs — do not hand-edit.
//
// Card identity (set, name, number, rarity) is pulled from
// PokemonTCG/pokemon-tcg-data, the open dataset behind the pokemontcg.io API,
// so every card listed here actually exists. Prices are a disclosed
// rarity-tier model (see modelPrice() in the generator script) because that
// dataset carries no pricing — src/lib/pokeApi.ts overlays real TCGPlayer
// near-mint prices on top of this same roster whenever pokemontcg.io is
// reachable. Regenerate with: node scripts/generate-cards.mjs
import type { Card, PokemonDef, SetDef } from "./types";

export const SET_DEFS: SetDef[] = ${JSON.stringify(setDefs, null, 2)};

export const POKEMON_DEFS: PokemonDef[] = ${JSON.stringify(pokemonDefs, null, 2)};

export const FIXTURE_CARDS: Card[] = ${JSON.stringify(cards, null, 2)};
`;

  const outPath = path.join(process.cwd(), "src", "lib", "fixtures.ts");
  await writeFile(outPath, out);
  console.log(`\nWrote ${cards.length} cards, ${setDefs.length} sets, ${pokemonDefs.length} pokemon indices to ${outPath}`);

  // Plain-JSON manifest (index -> real card ids) for scripts/snapshot.mjs,
  // which can't import fixtures.ts's TypeScript directly.
  const manifest = {
    sets: setDefs.map((s) => ({
      id: s.id,
      name: s.name,
      cardIds: cards.filter((c) => c.setId === s.id).map((c) => c.id),
    })),
    pokemon: pokemonDefs.map((p) => ({
      id: p.id,
      name: p.name,
      cardIds: cards.filter((c) => c.pokemon === p.id).map((c) => c.id),
    })),
  };
  const manifestPath = path.join(process.cwd(), "data", "index-manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Wrote index manifest to ${manifestPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

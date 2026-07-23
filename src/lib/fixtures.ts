import type { Card, PokemonDef, SetDef } from "./types";

// ---------------------------------------------------------------------------
// Offline dataset used whenever the live pokemontcg.io API can't be reached
// (e.g. this build sandbox has no outbound network access) and to seed
// historical backfill. Prices are illustrative near-mint market estimates,
// not a live feed — the UI always shows a "Demo data" badge while this
// dataset is in use. See src/lib/pokeApi.ts for the live path.
// ---------------------------------------------------------------------------

export const SET_DEFS: SetDef[] = [
  { id: "champions-path", name: "Champion's Path", series: "Sword & Shield", ticker: "CPA", releaseDate: "2020-09-25", totalCards: 80 },
  { id: "vivid-voltage", name: "Vivid Voltage", series: "Sword & Shield", ticker: "VIV", releaseDate: "2020-11-13", totalCards: 203 },
  { id: "evolving-skies", name: "Evolving Skies", series: "Sword & Shield", ticker: "EVS", releaseDate: "2021-08-27", totalCards: 237 },
  { id: "brilliant-stars", name: "Brilliant Stars", series: "Sword & Shield", ticker: "BRS", releaseDate: "2022-02-25", totalCards: 186 },
  { id: "lost-origin", name: "Lost Origin", series: "Sword & Shield", ticker: "LOR", releaseDate: "2022-09-09", totalCards: 217 },
  { id: "silver-tempest", name: "Silver Tempest", series: "Sword & Shield", ticker: "SIT", releaseDate: "2022-11-11", totalCards: 215 },
  { id: "paldea-evolved", name: "Paldea Evolved", series: "Scarlet & Violet", ticker: "PEV", releaseDate: "2023-06-09", totalCards: 279 },
  { id: "scarlet-violet-151", name: "Scarlet & Violet: 151", series: "Scarlet & Violet", ticker: "M151", releaseDate: "2023-09-22", totalCards: 207 },
  { id: "paradox-rift", name: "Paradox Rift", series: "Scarlet & Violet", ticker: "PDX", releaseDate: "2023-11-03", totalCards: 266 },
  { id: "temporal-forces", name: "Temporal Forces", series: "Scarlet & Violet", ticker: "TEF", releaseDate: "2024-03-22", totalCards: 218 },
  { id: "surging-sparks", name: "Surging Sparks", series: "Scarlet & Violet", ticker: "SSP", releaseDate: "2024-11-08", totalCards: 252 },
  { id: "prismatic-evolutions", name: "Prismatic Evolutions", series: "Scarlet & Violet", ticker: "PRE", releaseDate: "2025-01-17", totalCards: 180 },
];

export const POKEMON_DEFS: PokemonDef[] = [
  { id: "charizard", name: "Charizard", ticker: "CHAR" },
  { id: "pikachu", name: "Pikachu", ticker: "PIKA" },
  { id: "umbreon", name: "Umbreon", ticker: "UMBR" },
  { id: "mew", name: "Mew", ticker: "MEW" },
  { id: "mewtwo", name: "Mewtwo", ticker: "MWTW" },
  { id: "eevee", name: "Eevee", ticker: "EEVE" },
  { id: "rayquaza", name: "Rayquaza", ticker: "RAYQ" },
  { id: "gengar", name: "Gengar", ticker: "GNGR" },
  { id: "lugia", name: "Lugia", ticker: "LUGI" },
  { id: "sylveon", name: "Sylveon", ticker: "SYLV" },
  { id: "gyarados", name: "Gyarados", ticker: "GYAR" },
  { id: "snorlax", name: "Snorlax", ticker: "SNOR" },
];

type RawCard = [name: string, pokemon: string, rarity: string, price: number];

const SET_CARDS: Record<string, RawCard[]> = {
  "champions-path": [
    ["Charizard VMAX", "charizard", "Rainbow Rare", 195.0],
    ["Charizard V", "charizard", "Full Art", 42.0],
    ["Charizard", "charizard", "Holo Rare", 13.5],
    ["Pikachu VMAX", "pikachu", "Rainbow Rare", 68.0],
    ["Pikachu V", "pikachu", "Full Art", 16.0],
    ["Snorlax V", "snorlax", "Full Art", 11.0],
    ["Eternatus VMAX", "eternatus", "Rainbow Rare", 55.0],
    ["Zamazenta V", "zamazenta", "Full Art", 9.0],
  ],
  "vivid-voltage": [
    ["Pikachu VMAX", "pikachu", "Rainbow Rare", 78.0],
    ["Pikachu V", "pikachu", "Full Art", 14.0],
    ["Zapdos V", "zapdos", "Full Art", 8.5],
    ["Rayquaza VMAX", "rayquaza", "Rainbow Rare", 92.0],
    ["Rayquaza V", "rayquaza", "Full Art", 19.0],
    ["Gengar VMAX", "gengar", "Rainbow Rare", 58.0],
    ["Gengar V", "gengar", "Full Art", 15.0],
    ["Eevee VMAX", "eevee", "Rainbow Rare", 36.0],
    ["Snorlax VMAX", "snorlax", "Rainbow Rare", 44.0],
    ["Boltund VMAX", "boltund", "Rainbow Rare", 9.0],
  ],
  "evolving-skies": [
    ["Umbreon VMAX", "umbreon", "Alternate Art", 585.0],
    ["Umbreon V", "umbreon", "Alternate Art", 165.0],
    ["Umbreon VMAX", "umbreon", "Rainbow Rare", 92.0],
    ["Rayquaza VMAX", "rayquaza", "Alternate Art", 310.0],
    ["Rayquaza V", "rayquaza", "Alternate Art", 88.0],
    ["Gengar VMAX", "gengar", "Alternate Art", 145.0],
    ["Sylveon VMAX", "sylveon", "Alternate Art", 210.0],
    ["Sylveon V", "sylveon", "Alternate Art", 62.0],
    ["Leafeon VMAX", "leafeon", "Alternate Art", 78.0],
    ["Glaceon VMAX", "glaceon", "Alternate Art", 68.0],
    ["Vaporeon VMAX", "vaporeon", "Alternate Art", 74.0],
    ["Jolteon VMAX", "jolteon", "Alternate Art", 71.0],
  ],
  "brilliant-stars": [
    ["Charizard VSTAR", "charizard", "Ultra Rare", 48.0],
    ["Charizard V", "charizard", "Alternate Art", 220.0],
    ["Radiant Charizard", "charizard", "Radiant Rare", 34.0],
    ["Umbreon VSTAR", "umbreon", "Ultra Rare", 55.0],
    ["Mew VMAX", "mew", "Ultra Rare", 26.0],
    ["Rayquaza VSTAR", "rayquaza", "Ultra Rare", 21.0],
    ["Arceus VSTAR", "arceus", "Ultra Rare", 15.0],
    ["Radiant Gyarados", "gyarados", "Radiant Rare", 22.0],
  ],
  "lost-origin": [
    ["Giratina VSTAR", "giratina", "Alternate Art", 120.0],
    ["Giratina VSTAR", "giratina", "Rainbow Rare", 38.0],
    ["Hisuian Zoroark VSTAR", "zoroark", "Ultra Rare", 12.0],
    ["Cyclizar", "cyclizar", "Holo Rare", 5.0],
    ["Sneasler VSTAR", "sneasler", "Ultra Rare", 9.0],
    ["Enamorus V", "enamorus", "Full Art", 4.5],
  ],
  "silver-tempest": [
    ["Lugia VSTAR", "lugia", "Alternate Art", 340.0],
    ["Lugia VSTAR", "lugia", "Rainbow Rare", 68.0],
    ["Lugia V", "lugia", "Alternate Art", 95.0],
    ["Regidrago VSTAR", "regidrago", "Ultra Rare", 8.0],
    ["Regieleki VSTAR", "regieleki", "Ultra Rare", 9.5],
    ["Gyarados VSTAR", "gyarados", "Ultra Rare", 18.0],
  ],
  "paldea-evolved": [
    ["Iron Valiant ex", "iron valiant", "Special Illustration Rare", 14.0],
    ["Roaring Moon ex", "roaring moon", "Special Illustration Rare", 11.0],
    ["Chien-Pao ex", "chien-pao", "Special Illustration Rare", 9.0],
    ["Skeledirge ex", "skeledirge", "Special Illustration Rare", 7.0],
    ["Garganacl ex", "garganacl", "Special Illustration Rare", 6.5],
    ["Ceruledge ex", "ceruledge", "Special Illustration Rare", 5.5],
  ],
  "scarlet-violet-151": [
    ["Charizard ex", "charizard", "Special Illustration Rare", 385.0],
    ["Charizard ex", "charizard", "Full Art", 62.0],
    ["Mew ex", "mew", "Special Illustration Rare", 210.0],
    ["Mew ex", "mew", "Full Art", 34.0],
    ["Mewtwo ex", "mewtwo", "Special Illustration Rare", 165.0],
    ["Mewtwo ex", "mewtwo", "Full Art", 28.0],
    ["Pikachu", "pikachu", "Illustration Rare", 58.0],
    ["Pikachu ex", "pikachu", "Special Illustration Rare", 145.0],
    ["Gyarados ex", "gyarados", "Special Illustration Rare", 88.0],
    ["Gyarados ex", "gyarados", "Full Art", 16.0],
    ["Snorlax", "snorlax", "Illustration Rare", 42.0],
    ["Eevee", "eevee", "Illustration Rare", 38.0],
    ["Gengar ex", "gengar", "Special Illustration Rare", 95.0],
  ],
  "paradox-rift": [
    ["Gardevoir ex", "gardevoir", "Special Illustration Rare", 45.0],
    ["Iron Hands ex", "iron hands", "Special Illustration Rare", 12.0],
    ["Walking Wake ex", "walking wake", "Special Illustration Rare", 9.0],
    ["Great Tusk ex", "great tusk", "Special Illustration Rare", 8.0],
    ["Tyranitar ex", "tyranitar", "Special Illustration Rare", 14.0],
  ],
  "temporal-forces": [
    ["Iron Boulder ex", "iron boulder", "Special Illustration Rare", 11.0],
    ["Iron Crown ex", "iron crown", "Special Illustration Rare", 9.5],
    ["Eevee ex", "eevee", "Special Illustration Rare", 26.0],
    ["Gholdengo ex", "gholdengo", "Special Illustration Rare", 22.0],
    ["Dipplin", "dipplin", "Illustration Rare", 3.5],
  ],
  "surging-sparks": [
    ["Pikachu ex", "pikachu", "Special Illustration Rare", 210.0],
    ["Pikachu ex", "pikachu", "Full Art", 45.0],
    ["Dragapult ex", "dragapult", "Special Illustration Rare", 68.0],
    ["Terapagos ex", "terapagos", "Special Illustration Rare", 130.0],
    ["Mewtwo ex", "mewtwo", "Ultra Rare", 34.0],
  ],
  "prismatic-evolutions": [
    ["Umbreon ex", "umbreon", "Special Illustration Rare", 465.0],
    ["Umbreon ex", "umbreon", "Full Art", 58.0],
    ["Sylveon ex", "sylveon", "Special Illustration Rare", 240.0],
    ["Sylveon ex", "sylveon", "Full Art", 42.0],
    ["Eevee ex", "eevee", "Special Illustration Rare", 175.0],
    ["Charizard ex", "charizard", "Special Illustration Rare", 295.0],
    ["Espeon ex", "espeon", "Special Illustration Rare", 88.0],
    ["Vaporeon ex", "vaporeon", "Special Illustration Rare", 72.0],
  ],
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const FIXTURE_CARDS: Card[] = Object.entries(SET_CARDS).flatMap(([setId, cards]) => {
  const total = SET_DEFS.find((s) => s.id === setId)?.totalCards ?? cards.length;
  return cards.map(([name, pokemon, rarity, price], i) => ({
    id: `${setId}-${slugify(name)}-${i}`,
    name,
    pokemon,
    setId,
    number: `${String(i + 1).padStart(3, "0")}/${total}`,
    rarity,
    price,
  }));
});

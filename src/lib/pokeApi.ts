import type { Card } from "./types";

// ---------------------------------------------------------------------------
// Live data layer: pulls near-mint (TCGPlayer "market" price) card data from
// the free pokemontcg.io API, which mirrors TCGPlayer pricing. Every call is
// short-timeout + try/catch so a network failure degrades to the offline
// fixture dataset (src/lib/fixtures.ts) rather than breaking the page.
// ---------------------------------------------------------------------------

const BASE = "https://api.pokemontcg.io/v2";
const TIMEOUT_MS = 6000;
const MODERN_CUTOFF = "2020/01/01";

const PRICE_VARIANT_PRIORITY = [
  "normal",
  "holofoil",
  "reverseHolofoil",
  "1stEditionHolofoil",
  "1stEditionNormal",
  "unlimited",
  "unlimitedHolofoil",
] as const;

type TcgPlayerPrices = Partial<Record<string, { market?: number | null }>>;

type ApiCard = {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  set: { id: string; name: string; releaseDate: string };
  tcgplayer?: { prices?: TcgPlayerPrices };
};

function nearMintMarketPrice(card: ApiCard): number | null {
  const prices = card.tcgplayer?.prices;
  if (!prices) return null;
  for (const variant of PRICE_VARIANT_PRIORITY) {
    const market = prices[variant]?.market;
    if (typeof market === "number" && market > 0) return market;
  }
  return null;
}

async function getJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`pokemontcg.io ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function toCard(api: ApiCard, pokemon: string): Card | null {
  const price = nearMintMarketPrice(api);
  if (price === null) return null;
  return {
    id: api.id,
    name: api.name,
    pokemon,
    setId: api.set.id,
    number: api.number,
    rarity: api.rarity ?? "Unknown",
    price,
  };
}

/** Resolve a set's live id by exact name, then fetch its near-mint priced cards. */
export async function fetchLiveCardsForSet(setName: string): Promise<Card[]> {
  const setRes = await getJson<{ data: { id: string }[] }>(
    `${BASE}/sets?q=${encodeURIComponent(`name:"${setName}"`)}`
  );
  const setId = setRes.data[0]?.id;
  if (!setId) return [];
  const cardsRes = await getJson<{ data: ApiCard[] }>(
    `${BASE}/cards?q=${encodeURIComponent(`set.id:${setId}`)}&pageSize=250`
  );
  return cardsRes.data
    .map((c) => toCard(c, c.name.split(" ")[0]))
    .filter((c): c is Card => c !== null);
}

/** Fetch every modern (2020+) card matching a Pokémon's base species name. */
export async function fetchLiveCardsForPokemon(pokemonName: string): Promise<Card[]> {
  const query = `name:"${pokemonName}" set.releaseDate:[${MODERN_CUTOFF} TO *]`;
  const cardsRes = await getJson<{ data: ApiCard[] }>(
    `${BASE}/cards?q=${encodeURIComponent(query)}&pageSize=250`
  );
  return cardsRes.data
    .map((c) => toCard(c, pokemonName.toLowerCase()))
    .filter((c): c is Card => c !== null);
}

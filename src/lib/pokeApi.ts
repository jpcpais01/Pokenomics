import { cache } from "react";

// ---------------------------------------------------------------------------
// Live data layer: overlays real near-mint (TCGPlayer "market" price) prices
// from the free pokemontcg.io API onto the real card roster already baked
// into src/lib/fixtures.ts (generated from PokemonTCG/pokemon-tcg-data).
//
// This never changes *which* cards an index shows — the roster is the same
// real card list either way — it only decides how each card is priced: a
// live TCGPlayer number when reachable, the rarity-tier model otherwise.
// Every call is short-timeout + try/catch so a network failure degrades
// gracefully instead of breaking the page, and every failure is logged so
// it's visible in the server console instead of silently going to "Demo
// data" with no explanation.
//
// Without an API key, pokemontcg.io rate-limits aggressively (a handful of
// requests/minute) and this app can easily need dozens of requests per page
// load. Get a free key at https://pokemontcg.io/ and set it as
// POKEMONTCG_API_KEY in .env.local — see README for details.
// ---------------------------------------------------------------------------

const BASE = "https://api.pokemontcg.io/v2";
const TIMEOUT_MS = 8000;

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
    const headers: Record<string, string> = { Accept: "application/json" };
    if (process.env.POKEMONTCG_API_KEY) headers["X-Api-Key"] = process.env.POKEMONTCG_API_KEY;
    const res = await fetch(url, {
      signal: controller.signal,
      headers,
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`pokemontcg.io ${res.status} ${res.statusText} — ${body.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Fetches near-mint market prices for every card in one real set id, keyed by card id. Cached per request. */
export const fetchLivePricesForSet = cache(async (setId: string): Promise<Map<string, number>> => {
  const prices = new Map<string, number>();
  try {
    const res = await getJson<{ data: ApiCard[] }>(`${BASE}/cards?q=${encodeURIComponent(`set.id:${setId}`)}&pageSize=250`);
    for (const card of res.data) {
      const price = nearMintMarketPrice(card);
      if (price !== null) prices.set(card.id, price);
    }
  } catch (err) {
    console.warn(`[pokeApi] live price fetch failed for set "${setId}":`, err instanceof Error ? err.message : err);
  }
  return prices;
});

/** Fetches live near-mint prices for a list of real set ids, in parallel, merged into one map. */
export async function fetchLivePriceMap(setIds: string[]): Promise<Map<string, number>> {
  const merged = new Map<string, number>();
  const results = await Promise.all(setIds.map((id) => fetchLivePricesForSet(id)));
  for (const prices of results) for (const [id, price] of prices) merged.set(id, price);
  return merged;
}

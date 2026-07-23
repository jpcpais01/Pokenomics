// ---------------------------------------------------------------------------
// Live data layer: overlays real near-mint (TCGPlayer "market" price) prices
// from the free pokemontcg.io API onto the real card roster already baked
// into src/lib/fixtures.ts (generated from PokemonTCG/pokemon-tcg-data).
//
// This never changes *which* cards an index shows — the roster is the same
// real card list either way — it only decides how each card is priced: a
// live TCGPlayer number when reachable, the rarity-tier model otherwise.
// Every call is short-timeout + try/catch so a network failure degrades
// gracefully instead of breaking the page.
// ---------------------------------------------------------------------------

const BASE = "https://api.pokemontcg.io/v2";
const TIMEOUT_MS = 6000;

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

/** Fetches near-mint market prices for every card in one real set id, keyed by card id. */
async function fetchLivePricesForSet(setId: string): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  const res = await getJson<{ data: ApiCard[] }>(
    `${BASE}/cards?q=${encodeURIComponent(`set.id:${setId}`)}&pageSize=250&select=id,tcgplayer`
  );
  for (const card of res.data) {
    const price = nearMintMarketPrice(card);
    if (price !== null) prices.set(card.id, price);
  }
  return prices;
}

/**
 * Fetches live near-mint prices for every real set id used by the fixture
 * roster, in parallel. A set whose fetch fails is simply absent from the
 * result — callers treat a missing id as "price this card from the model."
 */
export async function fetchLivePriceMap(setIds: string[]): Promise<Map<string, number>> {
  const merged = new Map<string, number>();
  const results = await Promise.allSettled(setIds.map((id) => fetchLivePricesForSet(id)));
  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const [id, price] of result.value) merged.set(id, price);
    }
  }
  return merged;
}

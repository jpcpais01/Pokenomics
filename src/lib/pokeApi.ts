import { cache } from "react";

// ---------------------------------------------------------------------------
// Live data layer: overlays real near-mint market prices from the free
// pokemontcg.io API onto the real card roster already baked into
// src/lib/fixtures.ts (generated from PokemonTCG/pokemon-tcg-data).
//
// This never changes *which* cards an index shows — the roster is the same
// real card list either way — it only decides how each card is priced: a
// live number when reachable, the rarity-tier model otherwise. Every call is
// short-timeout + try/catch so a network failure degrades gracefully instead
// of breaking the page, and every failure is logged so it's visible in the
// server console instead of silently going to "Demo data" with no
// explanation.
//
// pokemontcg.io's own free API key (get one at https://pokemontcg.io/ — this
// is a separate, self-serve signup from TCGPlayer's own developer program,
// which is reportedly closed to new applicants) is what POKEMONTCG_API_KEY
// is for. Its response carries two independent live price feeds per card:
//  - TCGPlayer (USD) — preferred, used as-is.
//  - Cardmarket (EUR) — used as a fallback, converted to USD at a fixed
//    approximate rate (see EUR_TO_USD below) since there's no live FX source
//    wired up. Both come from the same key — no separate signup needed.
// Without a key at all, pokemontcg.io rate-limits unauthenticated requests
// heavily; see README for details.
// ---------------------------------------------------------------------------

const BASE = "https://api.pokemontcg.io/v2";
const TIMEOUT_MS = 8000;

// Static approximation — there's no live FX rate source wired up. Recent
// EUR/USD has mostly sat in the 1.05-1.10 range; revisit if that drifts.
const EUR_TO_USD = 1.08;

const TCGPLAYER_VARIANT_PRIORITY = [
  "normal",
  "holofoil",
  "reverseHolofoil",
  "1stEditionHolofoil",
  "1stEditionNormal",
  "unlimited",
  "unlimitedHolofoil",
] as const;

type TcgPlayerPrices = Partial<Record<string, { market?: number | null }>>;
type CardmarketPrices = { trendPrice?: number | null; averageSellPrice?: number | null };

type ApiCard = {
  id: string;
  tcgplayer?: { prices?: TcgPlayerPrices };
  cardmarket?: { prices?: CardmarketPrices };
};

function nearMintMarketPriceUsd(card: ApiCard): number | null {
  const tcgPrices = card.tcgplayer?.prices;
  if (tcgPrices) {
    for (const variant of TCGPLAYER_VARIANT_PRIORITY) {
      const market = tcgPrices[variant]?.market;
      if (typeof market === "number" && market > 0) return market;
    }
  }
  const cmPrices = card.cardmarket?.prices;
  if (cmPrices) {
    const eur = cmPrices.trendPrice ?? cmPrices.averageSellPrice;
    if (typeof eur === "number" && eur > 0) return Math.round(eur * EUR_TO_USD * 100) / 100;
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

/** Fetches near-mint market prices (TCGPlayer, falling back to Cardmarket) for every card in one real set id, keyed by card id. Cached per request. */
export const fetchLivePricesForSet = cache(async (setId: string): Promise<Map<string, number>> => {
  const prices = new Map<string, number>();
  try {
    const res = await getJson<{ data: ApiCard[] }>(`${BASE}/cards?q=${encodeURIComponent(`set.id:${setId}`)}&pageSize=250`);
    for (const card of res.data) {
      const price = nearMintMarketPriceUsd(card);
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

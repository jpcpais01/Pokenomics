import { cache } from "react";
import type { Card } from "./types";

// ---------------------------------------------------------------------------
// Second live pricing source: pricecharting.com's product API. TCGPlayer's
// developer program (which pokemontcg.io depends on) is reportedly closed to
// new applicants, so this is the fallback path — see src/lib/pokeApi.ts for
// the TCGPlayer/pokemontcg.io path, tried first.
//
// Unlike pokemontcg.io, PriceCharting has no per-card id we can query
// directly: each card is matched by a text search (name + number + set),
// scored, and only accepted above a confidence threshold — a low-confidence
// match is treated as "no live price" rather than risking a wrong number
// attached to the wrong card.
//
// Opt-in: only runs at all if PRICECHARTING_API_KEY is set (see README).
// I could not verify this integration against the live API — outbound
// access to pricecharting.com is blocked in the sandbox this was built in.
// If prices don't populate, check the server console: every failed/rejected
// lookup logs why (see also scripts/test-price-sources.mjs).
// ---------------------------------------------------------------------------

const BASE = "https://www.pricecharting.com/api";
const TIMEOUT_MS = 6000;
const CONCURRENCY = 8;
const MATCH_THRESHOLD = 0.6;

// PriceCharting's schema was originally built for video games ("loose" =
// unboxed cartridge); trading cards are believed to reuse that field for
// "ungraded", alongside a card-specific "ungraded-price" field on some
// endpoints. Try both, in priority order, since I can't confirm which one
// this account/tier actually returns.
const RAW_PRICE_FIELDS = ["ungraded-price", "loose-price"] as const;

type PcProduct = Partial<Record<(typeof RAW_PRICE_FIELDS)[number], number | null>> & {
  "product-name"?: string;
  "console-name"?: string;
};

type PcSearchResponse = {
  status?: string;
  products?: PcProduct[];
};

function rawPriceUsd(product: PcProduct): number | null {
  for (const field of RAW_PRICE_FIELDS) {
    const cents = product[field];
    if (typeof cents === "number" && cents > 0) return cents / 100; // PriceCharting prices are integer cents
  }
  return null;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** 0 = reject, higher = more confident. Requires the set and full card name to match; the card number is a bonus signal. */
function scoreMatch(cardName: string, cardNumber: string, setName: string, product: PcProduct): number {
  const productName = normalize(product["product-name"] ?? "");
  const consoleName = normalize(product["console-name"] ?? "");
  if (!productName || !consoleName.includes("pokemon")) return 0;

  const setWords = normalize(setName)
    .split(" ")
    .filter((w) => w.length > 2);
  if (setWords.length > 0 && !setWords.every((w) => consoleName.includes(w))) return 0;

  const nameWords = normalize(cardName)
    .split(" ")
    .filter((w) => w.length > 1);
  if (nameWords.length === 0 || !nameWords.every((w) => productName.includes(w))) return 0;

  let score = 0.6;
  const num = Number.parseInt(cardNumber, 10);
  if (!Number.isNaN(num) && productName.includes(String(num))) score += 0.3;
  return score;
}

async function getJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 3600 } });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`pricecharting.com ${res.status} ${res.statusText} — ${body.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Searches PriceCharting for one card and returns its raw/ungraded price if a confident match is found. Cached per request. */
const lookupCard = cache(async (cardId: string, cardName: string, cardNumber: string, setName: string): Promise<number | null> => {
  const token = process.env.PRICECHARTING_API_KEY;
  if (!token) return null;
  try {
    const q = `${cardName} ${cardNumber} ${setName}`;
    const res = await getJson<PcSearchResponse>(`${BASE}/products?t=${encodeURIComponent(token)}&q=${encodeURIComponent(q)}`);
    if (res.status !== "success" || !res.products?.length) return null;

    let best: { score: number; price: number } | null = null;
    for (const product of res.products) {
      const score = scoreMatch(cardName, cardNumber, setName, product);
      if (score < MATCH_THRESHOLD) continue;
      const price = rawPriceUsd(product);
      if (price === null) continue;
      if (!best || score > best.score) best = { score, price };
    }
    return best?.price ?? null;
  } catch (err) {
    console.warn(`[priceCharting] lookup failed for "${cardName} #${cardNumber}" (${setName}):`, err instanceof Error ? err.message : err);
    return null;
  }
});

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Looks up live raw/near-mint prices for a batch of cards from one set. No-ops (returns empty) if no API key is configured. */
export async function fetchPriceChartingPrices(cards: Card[], setName: string): Promise<Map<string, number>> {
  if (!process.env.PRICECHARTING_API_KEY || cards.length === 0) return new Map();
  const pairs = await mapWithConcurrency(cards, CONCURRENCY, async (card) => {
    const price = await lookupCard(card.id, card.name, card.number, setName);
    return [card.id, price] as const;
  });
  const map = new Map<string, number>();
  for (const [id, price] of pairs) if (price !== null) map.set(id, price);
  return map;
}

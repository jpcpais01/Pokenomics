import { FIXTURE_CARDS, POKEMON_DEFS, SET_DEFS } from "./fixtures";
import { buildHistory, estimateCardChange, pctChange, valueDaysAgo } from "./history";
import { fetchLivePriceMap } from "./pokeApi";
import { fetchPriceChartingPrices } from "./priceCharting";
import type { Card, IndexSummary } from "./types";

const LIVE_COVERAGE_THRESHOLD = 0.8;
// PriceCharting has no exact-id lookup — each miss is a text search, so cap
// how many an index will attempt (its priciest-by-model cards first) to keep
// page latency bounded regardless of index size.
const MAX_PRICECHARTING_LOOKUPS = 40;

const SET_NAME_BY_ID = new Map(SET_DEFS.map((s) => [s.id, s.name]));

/**
 * TCGPlayer (via pokemontcg.io) first, since it's an exact card-id match;
 * PriceCharting fills in cards TCGPlayer missed, capped and grouped per set
 * for its text-search matching. Either source, or neither, can be absent —
 * whatever isn't covered keeps its rarity-tier model price.
 */
async function resolveLivePrices(cards: Card[], setIds: string[]): Promise<Map<string, number>> {
  const combined = await fetchLivePriceMap(setIds);

  const misses = cards.filter((c) => !combined.has(c.id)).sort((a, b) => b.price - a.price);
  const toLookUp = misses.slice(0, MAX_PRICECHARTING_LOOKUPS);
  const bySet = new Map<string, Card[]>();
  for (const card of toLookUp) {
    const group = bySet.get(card.setId);
    if (group) group.push(card);
    else bySet.set(card.setId, [card]);
  }
  const pcResults = await Promise.all(
    [...bySet.entries()].map(([setId, setCards]) => fetchPriceChartingPrices(setCards, SET_NAME_BY_ID.get(setId) ?? setId))
  );
  for (const map of pcResults) for (const [id, price] of map) combined.set(id, price);

  return combined;
}

function priceCards(cards: Card[], liveMap: Map<string, number>): { cards: Card[]; isLive: boolean } {
  let liveHits = 0;
  const priced = cards.map((c) => {
    const live = liveMap.get(c.id);
    if (live !== undefined) liveHits++;
    return live !== undefined ? { ...c, price: live } : c;
  });
  const isLive = cards.length > 0 && liveHits / cards.length >= LIVE_COVERAGE_THRESHOLD;
  return { cards: priced, isLive };
}

function summarize(
  type: "set" | "pokemon",
  id: string,
  name: string,
  ticker: string,
  subtitle: string,
  cards: Card[],
  isLive: boolean,
  sinceDate: string
): IndexSummary {
  const value = cards.length ? cards.reduce((s, c) => s + c.price, 0) / cards.length : 0;
  const totalValue = cards.reduce((s, c) => s + c.price, 0);
  const history = buildHistory(`${type}-${id}`, value, sinceDate);
  const v1 = valueDaysAgo(history, 1);
  const v7 = valueDaysAgo(history, 7);
  const v30 = valueDaysAgo(history, 30);
  const allTimeHigh = history.reduce((m, p) => Math.max(m, p.value), value);
  const allTimeLow = history.reduce((m, p) => Math.min(m, p.value), value);

  const withChange = cards.map((c) => ({ card: c, change7d: estimateCardChange(c.id, c.price, 7) }));
  const topGainer = withChange.length
    ? withChange.reduce((a, b) => (b.change7d > a.change7d ? b : a))
    : null;
  const topLoser = withChange.length
    ? withChange.reduce((a, b) => (b.change7d < a.change7d ? b : a))
    : null;

  return {
    type,
    id,
    name,
    ticker,
    subtitle,
    cards,
    value,
    totalValue,
    change1d: pctChange(v1, value),
    change7d: pctChange(v7, value),
    change30d: pctChange(v30, value),
    allTimeHigh,
    allTimeLow,
    topGainer,
    topLoser,
    history,
    isLive,
  };
}

export async function getSetIndex(setId: string): Promise<IndexSummary | null> {
  const def = SET_DEFS.find((s) => s.id === setId);
  if (!def) return null;
  const fixtureCards = FIXTURE_CARDS.filter((c) => c.setId === setId);
  // Only this one real set's cards are needed — a set index never spans sets.
  const liveMap = await resolveLivePrices(fixtureCards, [setId]);
  const { cards, isLive } = priceCards(fixtureCards, liveMap);
  return summarize(
    "set",
    def.id,
    def.name,
    def.ticker,
    `${def.series} · Released ${new Date(def.releaseDate).getFullYear()} · ${def.totalCards} cards in set`,
    cards,
    isLive,
    def.releaseDate
  );
}

export async function getPokemonIndex(pokemonId: string): Promise<IndexSummary | null> {
  const def = POKEMON_DEFS.find((p) => p.id === pokemonId);
  if (!def) return null;
  const fixtureCards = FIXTURE_CARDS.filter((c) => c.pokemon === pokemonId);
  // Only the real sets this species' cards actually come from — usually a
  // small subset of all tracked sets, not all of them.
  const relevantSetIds = [...new Set(fixtureCards.map((c) => c.setId))];
  const liveMap = await resolveLivePrices(fixtureCards, relevantSetIds);
  const { cards, isLive } = priceCards(fixtureCards, liveMap);
  return summarize(
    "pokemon",
    def.id,
    `${def.name} Index`,
    def.ticker,
    `${cards.length} modern chase cards · every 2020+ set`,
    cards,
    isLive,
    "2020-01-01"
  );
}

export async function getAllSetIndices(): Promise<IndexSummary[]> {
  const results = await Promise.all(SET_DEFS.map((s) => getSetIndex(s.id)));
  return results.filter((r): r is IndexSummary => r !== null);
}

export async function getAllPokemonIndices(): Promise<IndexSummary[]> {
  const results = await Promise.all(POKEMON_DEFS.map((p) => getPokemonIndex(p.id)));
  return results.filter((r): r is IndexSummary => r !== null);
}

export type MarketOverview = {
  totalValue: number;
  change1d: number;
  change7d: number;
  isLive: boolean;
  indexCount: number;
  cardCount: number;
};

export function summarizeMarket(all: IndexSummary[]): MarketOverview {
  const totalValue = all.reduce((s, i) => s + i.totalValue, 0);
  const weightedChange1d = all.reduce((s, i) => s + i.change1d * i.totalValue, 0) / (totalValue || 1);
  const weightedChange7d = all.reduce((s, i) => s + i.change7d * i.totalValue, 0) / (totalValue || 1);
  return {
    totalValue,
    change1d: weightedChange1d,
    change7d: weightedChange7d,
    isLive: all.some((i) => i.isLive),
    indexCount: all.length,
    // Distinct cards — a Pokémon index and a set index can share constituents.
    cardCount: new Set(all.flatMap((i) => i.cards.map((c) => c.id))).size,
  };
}

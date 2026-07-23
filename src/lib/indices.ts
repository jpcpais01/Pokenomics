import { FIXTURE_CARDS, POKEMON_DEFS, SET_DEFS } from "./fixtures";
import { buildHistory, estimateCardChange, pctChange, valueDaysAgo } from "./history";
import { fetchLiveCardsForPokemon, fetchLiveCardsForSet } from "./pokeApi";
import type { Card, IndexSummary } from "./types";

const MODERN_CUTOFF = "2020-01-01";

async function resolveCards(
  live: () => Promise<Card[]>,
  fixtureCards: Card[]
): Promise<{ cards: Card[]; isLive: boolean }> {
  try {
    const cards = await live();
    if (cards.length > 0) return { cards, isLive: true };
  } catch {
    // fall through to fixtures
  }
  return { cards: fixtureCards, isLive: false };
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
  const { cards, isLive } = await resolveCards(() => fetchLiveCardsForSet(def.name), fixtureCards);
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
  const { cards, isLive } = await resolveCards(() => fetchLiveCardsForPokemon(def.name), fixtureCards);
  return summarize(
    "pokemon",
    def.id,
    `${def.name} Index`,
    def.ticker,
    `${cards.length} modern cards · 2020–present`,
    cards,
    isLive,
    MODERN_CUTOFF
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
    cardCount: all.reduce((s, i) => s + i.cards.length, 0),
  };
}

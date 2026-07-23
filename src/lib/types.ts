// Core domain types shared by the live pokemontcg.io fetch layer and the
// offline fixture dataset, so index computation doesn't care which one fed it.

export type Card = {
  id: string;
  name: string;
  /** Species slug used to group cards into a Pokémon index (e.g. "charizard"), or null if its species didn't make the index roster. */
  pokemon: string | null;
  setId: string;
  number: string;
  rarity: string;
  image?: string;
  /** TCGPlayer near-mint market price, USD. */
  price: number;
};

export type SetDef = {
  id: string;
  name: string;
  series: string;
  ticker: string;
  releaseDate: string; // ISO yyyy-mm-dd
  /** Real total card count of the set (for the "N of Y cards tracked" stat). */
  totalCards: number;
};

export type PokemonDef = {
  id: string;
  name: string;
  ticker: string;
};

export type IndexType = "set" | "pokemon";

export type IndexMeta = {
  type: IndexType;
  id: string;
  name: string;
  ticker: string;
  subtitle: string;
};

export type HistoryPoint = {
  date: string; // ISO date
  value: number;
};

export type IndexSummary = IndexMeta & {
  cards: Card[];
  /** Average near-mint price across constituents — the "index value". */
  value: number;
  /** Sum of near-mint prices across constituents — a market-cap analogue. */
  totalValue: number;
  change1d: number; // percent
  change7d: number;
  change30d: number;
  allTimeHigh: number;
  allTimeLow: number;
  topGainer: { card: Card; change7d: number } | null;
  topLoser: { card: Card; change7d: number } | null;
  history: HistoryPoint[];
  isLive: boolean;
};

export type Range = "7D" | "30D" | "90D" | "1Y" | "ALL";

# Pokenomics

The Pokémon card market, tracked like a financial market. Modern (2020+) chase
cards are grouped into curated baskets — **Set indices** (one per set) and
**Pokémon indices** (every notable card of one species, across sets) — each
priced from near-mint TCGPlayer market data, with a value chart and market
statistics.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS v4. No database — pricing
comes from a live API call at request time, with a bundled fallback dataset
and a JSON-file history store.

## Data

- **Prices**: [pokemontcg.io](https://pokemontcg.io), a free API that mirrors
  TCGPlayer pricing. Each card's price is TCGPlayer's near-mint **market**
  price (`src/lib/pokeApi.ts`). If a live lookup fails for an index (rate
  limit, no network, etc.), that index falls back to the bundled dataset in
  `src/lib/fixtures.ts` and the UI shows a **Demo data** badge instead of
  **Live TCGPlayer data**, so it's always clear which one you're looking at.
- **History**: no free source publishes real historical raw-card prices, so
  each index's chart is a deterministic, seeded backfill anchored to today's
  real value (`src/lib/history.ts`) until real data accumulates. Run
  `npm run snapshot` (or let `.github/workflows/snapshot.yml` run it daily)
  to record real values into `data/history/*.json`; once present, real
  snapshots replace the backfilled portion of the chart.

## Development

```bash
npm install
npm run dev
```

Requires outbound network access to `api.pokemontcg.io` for live prices —
without it, the app runs entirely on the bundled fixture dataset.

```bash
npm run build     # production build
npm run lint      # eslint
npm run snapshot  # record today's real index values into data/history/
```

## Project layout

- `src/lib/types.ts` — shared domain types (`Card`, `IndexSummary`, …)
- `src/lib/fixtures.ts` — offline reference dataset (sets, Pokémon, cards)
- `src/lib/pokeApi.ts` — live pokemontcg.io fetch layer
- `src/lib/indices.ts` — builds a set/Pokémon index from live-or-fixture cards
- `src/lib/history.ts` — seeded backfill + real snapshot overlay
- `src/app/` — home (market overview) and `/index/[type]/[id]` (detail) pages
- `scripts/snapshot.mjs` — daily price recorder, run by the GitHub Action

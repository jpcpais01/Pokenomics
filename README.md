# Pokenomics

The Pokémon card market, tracked like a financial market. Modern (2020+) chase
cards are grouped into curated baskets — **Set indices** (one per set) and
**Pokémon indices** (data-driven: the species with the most chase cards) —
each priced from near-mint TCGPlayer market data, with a value chart and
market statistics.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS v4. No database — card
identity is a generated static dataset, prices come from a live API call at
request time with a modeled fallback, and history is a JSON-file store.

## Data

- **Which cards exist**: pulled from
  [PokemonTCG/pokemon-tcg-data](https://github.com/PokemonTCG/pokemon-tcg-data),
  the open dataset behind the pokemontcg.io API. `scripts/generate-cards.mjs`
  fetches every main English set released 2020+, keeps chase-tier rarities
  (Illustration Rares, VMAX/VSTAR, ex/ultra rares and up), and writes the real
  result to `src/lib/fixtures.ts` — nothing about which cards exist is
  hand-typed. The 16 Pokémon indices are chosen the same way: whichever
  species has the most chase-tier cards, grouped by National Pokédex number.
- **Prices**: [pokemontcg.io](https://pokemontcg.io), a free API that mirrors
  TCGPlayer pricing. `src/lib/pokeApi.ts` fetches each real card's near-mint
  **market** price by its exact card id and overlays it onto the roster above
  — live pricing never changes which cards an index shows, only what they're
  priced at. A card (or a whole index, if coverage is too thin) without a
  live price falls back to a disclosed rarity-tier price model. Every index
  is labeled **Live TCGPlayer data** or **Demo data** so it's always clear
  which pricing you're looking at.
- **History**: no free source publishes real historical raw-card prices, so
  each index's chart is a deterministic, seeded backfill anchored to today's
  real value (`src/lib/history.ts`) until real data accumulates. Run
  `npm run snapshot` (or let `.github/workflows/snapshot.yml` run it daily)
  to fetch live prices for each index's exact real cards and record the
  average into `data/history/*.json`; once present, real snapshots replace
  the backfilled portion of the chart.

## Development

```bash
npm install
npm run dev
```

Requires outbound network access to `api.pokemontcg.io` for live prices —
without it, the app runs entirely on the generated real-roster / modeled-price
dataset.

**Get a free API key.** Without one, pokemontcg.io rate-limits requests
heavily and this app can easily need dozens per page load, so live pricing
may look like it "doesn't work" — it's being rate-limited, not failing.
Get a free key at [pokemontcg.io](https://pokemontcg.io/), then create
`.env.local`:

```
POKEMONTCG_API_KEY=your-key-here
```

If prices still don't go live, check the terminal running `next dev` /
`next start` — `src/lib/pokeApi.ts` logs the exact reason (rate limit,
timeout, network error) every time a live fetch fails, rather than failing
silently.

```bash
npm run build     # production build
npm run lint      # eslint
npm run generate  # re-derive src/lib/fixtures.ts + data/index-manifest.json from pokemon-tcg-data
npm run snapshot  # record today's real index values into data/history/
```

## Project layout

- `src/lib/types.ts` — shared domain types (`Card`, `IndexSummary`, …)
- `src/lib/fixtures.ts` — **generated** real card roster (do not hand-edit)
- `src/lib/pokeApi.ts` — live pokemontcg.io price-overlay layer
- `src/lib/indices.ts` — builds a set/Pokémon index, live-priced where possible
- `src/lib/history.ts` — seeded backfill + real snapshot overlay
- `src/app/` — home (market overview) and `/index/[type]/[id]` (detail) pages
- `scripts/generate-cards.mjs` — regenerates the real card roster
- `scripts/snapshot.mjs` — daily price recorder, run by the GitHub Action
- `data/index-manifest.json` — generated: index id → real constituent card ids

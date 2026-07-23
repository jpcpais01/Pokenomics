# Pokenomics

The Pokémon card market, tracked like a financial market. Modern (2020+) chase
cards are grouped into curated baskets — **Set indices** (one per set) and
**Pokémon indices** (data-driven: the species with the most chase cards) —
each priced from a near-mint raw market price, with a value chart and market
statistics.

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
- **Prices**: two live sources, tried in order, before falling back to a model.
  1. [pokemontcg.io](https://pokemontcg.io) (`src/lib/pokeApi.ts`), a free API
     that mirrors TCGPlayer pricing — an exact match, since every card id here
     already is a real pokemontcg.io card id. TCGPlayer's developer program is
     reportedly closed to new applicants, so this only helps if you already
     have a key.
  2. [PriceCharting](https://www.pricecharting.com/api-documentation)
     (`src/lib/priceCharting.ts`), for whatever TCGPlayer didn't cover —
     matched by a text search (name, number, set) and only accepted above a
     confidence threshold, since it has no exact-id lookup.

  Neither changes which cards an index shows, only what they're priced at. A
  card (or a whole index, if coverage is too thin) that neither source prices
  falls back to a disclosed rarity-tier price model. Every index is labeled
  **Live pricing** or **Demo data** so it's always clear which you're looking
  at.
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

Live prices are entirely optional — without any key configured, the app runs
on the generated real-roster / modeled-price dataset and everything still
works, just labeled "Demo data".

**To get live prices, set at least one of these in `.env.local`:**

```
POKEMONTCG_API_KEY=your-tcgplayer-via-pokemontcgio-key
PRICECHARTING_API_KEY=your-pricecharting-token
```

- `POKEMONTCG_API_KEY` — from [pokemontcg.io](https://pokemontcg.io/). Without
  one, pokemontcg.io rate-limits unauthenticated requests heavily; TCGPlayer's
  own developer program is reportedly not accepting new applicants, so this
  only helps if you already have a key from before.
- `PRICECHARTING_API_KEY` — a token from
  [pricecharting.com](https://www.pricecharting.com/api-documentation). This
  is the fallback source, tried for whatever TCGPlayer didn't cover.
  **I built this integration without being able to test it against the live
  API** (outbound access to pricecharting.com wasn't available in the sandbox
  it was built in) — the request/response shape is my best understanding of
  their documented API, not verified end-to-end. Run `npm run test:prices`
  (`scripts/test-price-sources.mjs`) to sanity-check both keys and see the
  raw responses for a few sample cards, without running the whole app.

Either way, check the terminal running `next dev` / `next start` if live
prices aren't showing up — `src/lib/pokeApi.ts` and `src/lib/priceCharting.ts`
log the exact reason (rate limit, bad token, timeout, no confident match,
etc.) for every failed lookup instead of failing silently.

```bash
npm run build     # production build
npm run lint      # eslint
npm run generate  # re-derive src/lib/fixtures.ts + data/index-manifest.json from pokemon-tcg-data
npm run snapshot  # record today's real index values into data/history/
```

## Project layout

- `src/lib/types.ts` — shared domain types (`Card`, `IndexSummary`, …)
- `src/lib/fixtures.ts` — **generated** real card roster (do not hand-edit)
- `src/lib/pokeApi.ts` — live pokemontcg.io (TCGPlayer) price-overlay layer
- `src/lib/priceCharting.ts` — live PriceCharting price-overlay layer (fallback)
- `src/lib/indices.ts` — builds a set/Pokémon index, live-priced where possible
- `src/lib/history.ts` — seeded backfill + real snapshot overlay
- `src/app/` — home (market overview) and `/index/[type]/[id]` (detail) pages
- `scripts/generate-cards.mjs` — regenerates the real card roster
- `scripts/snapshot.mjs` — daily price recorder, run by the GitHub Action
- `scripts/test-price-sources.mjs` — quick standalone check of your API keys
- `data/index-manifest.json` — generated: index id → real constituent card ids

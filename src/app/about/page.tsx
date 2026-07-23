import { SET_DEFS } from "@/lib/fixtures";

export const metadata = { title: "About — Pokenomics" };

export default function AboutPage() {
  return (
    <article className="flex flex-col gap-6 pb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">About Pokenomics</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Pokenomics treats the Pokémon card market like a financial market: modern chase cards grouped into tradeable-looking
          baskets, priced, and charted over time.
        </p>
      </div>

      <Section title="Which cards, and why they're real">
        <p>
          Every card&rsquo;s identity — its name, set, card number, and rarity — comes straight from{" "}
          <span className="text-text-primary">PokemonTCG/pokemon-tcg-data</span>, the open dataset that also powers the
          pokemontcg.io API. A generator script (<code className="text-text-primary">scripts/generate-cards.mjs</code>)
          pulls every card from every modern English set, keeps only cards at a chase-worthy rarity tier (Illustration
          Rares, VMAX/VSTAR, ex/ultra rares and above), and writes the real result into{" "}
          <code className="text-text-primary">src/lib/fixtures.ts</code>. Nothing about which cards exist or what set
          they&rsquo;re from is hand-typed or invented — re-run the script and it re-derives the same roster from the
          same source.
        </p>
      </Section>

      <Section title="How the Pokémon indices are chosen">
        <p>
          The 16 Pokémon indices aren&rsquo;t a hand-picked favorites list either: the generator counts how many
          chase-tier cards each species has across every modern set and takes the most frequent ones — currently led by
          Charizard and Pikachu (17 chase cards each), Gardevoir (14), Dragonite and Mew (10). Grouping is done by each
          card&rsquo;s National Pokédex number, so regional forms, Mega evolutions, and ex/VMAX variants of the same
          species all land in one index.
        </p>
      </Section>

      <Section title="Pricing">
        <p>
          Every price is meant to read as a <strong className="text-text-primary">near-mint TCGPlayer market price</strong>.
          When the free pokemontcg.io API (which mirrors TCGPlayer pricing) is reachable, each card&rsquo;s real live price
          is fetched by its exact card id and overlaid on the roster above — this never changes which cards an index
          shows, only what they&rsquo;re priced at. A card without a live price yet (or a whole index if too few of its
          cards have one) falls back to a disclosed rarity-tier model: a base price for its rarity tier, scaled by how
          often that species shows up as a chase card, with deterministic per-card variation. Every index is labeled{" "}
          <span className="font-medium text-text-primary">Live TCGPlayer data</span> or{" "}
          <span className="font-medium text-text-primary">Demo data</span>
          {" "}so it&rsquo;s always clear which pricing
          you&rsquo;re looking at — never both silently blended.
        </p>
      </Section>

      <Section title="Indices, not ETFs">
        <p>
          Each index is a curated basket, the same idea as a stock index or thematic fund: a{" "}
          <strong className="text-text-primary">Set index</strong>
          {" "}tracks the chase-tier cards from one modern set (2020 or later); a{" "}
          <strong className="text-text-primary">Pokémon index</strong>
          {" "}tracks every chase-tier modern card of one species, across sets. An index&rsquo;s value is the average
          near-mint price of its constituents; its total
          basket value sums them, a rough market-cap analogue.
        </p>
      </Section>

      <Section title="Price history">
        <p>
          No free source publishes real historical raw-card prices, so today&rsquo;s chart is a seeded, deterministic
          backfill anchored to the real current value — it always ends at today&rsquo;s live figure, and the same index
          always redraws the same shape. A daily snapshot job (see{" "}
          <code className="text-text-primary">scripts/snapshot.mjs</code>
          {" "}and the GitHub Action that runs it) fetches live prices for each index&rsquo;s exact real cards and
          records the average going forward; once enough real snapshots exist for an index, they replace the
          backfilled portion of its chart.
        </p>
      </Section>

      <Section title="Scope">
        <p>
          Every main English-language expansion released in 2020 or later is tracked — {SET_DEFS.length}
          {" "}sets spanning the Sword &amp; Shield, Scarlet &amp; Violet, and Mega Evolution eras — excluding
          promo-only and mini subset products (Trainer Gallery, Shiny Vault, McDonald&rsquo;s collections, and similar).
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      <div className="mt-1.5 text-sm leading-relaxed text-text-secondary">{children}</div>
    </section>
  );
}

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
          Every price is meant to read as a <strong className="text-text-primary">near-mint raw market price</strong>, and
          comes from up to three live sources, tried in order, before falling back to a model:
        </p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5">
          <li>
            <strong className="text-text-primary">TCGPlayer (USD)</strong>
            {" "}via the free pokemontcg.io API — an exact match, since every card id in this app already is a real
            pokemontcg.io card id. Needs a free key from{" "}
            <span className="text-text-primary">pokemontcg.io</span>
            {" "}itself — that&rsquo;s a separate, self-serve signup from TCGPlayer&rsquo;s own developer program,
            which is reportedly closed to new applicants.
          </li>
          <li>
            <strong className="text-text-primary">Cardmarket (EUR, converted to USD)</strong>, for whatever TCGPlayer
            didn&rsquo;t price — the same pokemontcg.io response carries both feeds, so no separate key is needed. The
            EUR→USD conversion is a fixed approximate rate, not a live exchange rate.
          </li>
          <li>
            <strong className="text-text-primary">PriceCharting</strong>, for whatever neither of the above covered —
            requires its own (paid) API access, so it&rsquo;s optional and off by default. Matched by a text search
            (card name, number, and set) and only accepted above a confidence threshold, since it has no exact-id
            lookup. A low-confidence match is treated as no live price rather than risking the wrong number.
          </li>
        </ol>
        <p className="mt-2">
          None of these change which cards an index shows, only what they&rsquo;re priced at. A card (or a whole
          index, if coverage is too thin) that none of them price falls back to a disclosed model instead: a base
          price for
          the card&rsquo;s rarity tier, scaled by a power curve on how often that species shows up as a chase card
          overall (real chase-card prices are dominated by how iconic the species is, far more than by rarity alone),
          plus small deterministic per-card variation — tuned to land in a believable range, not to match any specific
          card&rsquo;s real price. Every index is labeled{" "}
          <span className="font-medium text-text-primary">Live pricing</span> or{" "}
          <span className="font-medium text-text-primary">Demo data</span>
          {" "}so it&rsquo;s always clear which you&rsquo;re looking at — never both silently blended.
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

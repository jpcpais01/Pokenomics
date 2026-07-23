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

      <Section title="Pricing">
        <p>
          Every card price is a <strong className="text-text-primary">near-mint market price</strong>, the same figure
          TCGPlayer reports as its “market price” for the raw (ungraded) near-mint condition — pulled live from the free{" "}
          <span className="text-text-primary">pokemontcg.io</span> API, which mirrors TCGPlayer pricing. If a live lookup
          fails, that index falls back to a bundled reference dataset and is marked{" "}
          <span className="font-medium text-text-primary">Demo data</span> instead of{" "}
          <span className="font-medium text-text-primary">Live TCGPlayer data</span>, so it&rsquo;s always clear which
          you&rsquo;re looking at.
        </p>
      </Section>

      <Section title="Indices, not ETFs">
        <p>
          Each index is a curated basket, the same idea as a stock index or thematic fund: a{" "}
          <strong className="text-text-primary">Set index</strong> tracks the flagship chase cards from one modern set
          (2020 or later); a <strong className="text-text-primary">Pokémon index</strong> tracks every notable modern card
          of one species — every Charizard, every Pikachu — across sets. An index&rsquo;s value is the average near-mint price of
          its constituents; its total basket value sums them, a rough market-cap analogue.
        </p>
      </Section>

      <Section title="Price history">
        <p>
          No free source publishes real historical raw card prices, so today&rsquo;s chart is a seeded, deterministic backfill
          anchored to the real current value — it always ends at today&rsquo;s live figure, and the same index always redraws
          the same shape. A daily snapshot job (see <code className="text-text-primary">scripts/snapshot.mjs</code> and the
          GitHub Action that runs it) records real values going forward; once enough real snapshots exist for an index,
          they replace the backfilled portion of its chart.
        </p>
      </Section>

      <Section title="Scope">
        <p>
          Only English-language sets released in 2020 or later are tracked, spanning the Sword &amp; Shield and Scarlet
          &amp; Violet eras through early 2025.
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

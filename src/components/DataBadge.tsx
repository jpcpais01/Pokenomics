export function DataBadge({ isLive }: { isLive: boolean }) {
  if (isLive) {
    return (
      <span
        className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-text-secondary"
        title="Priced from a live source (TCGPlayer or Cardmarket via pokemontcg.io, or PriceCharting) matched to this exact card, not the fallback model."
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--good)" }} />
        Live pricing
      </span>
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      title="These are real cards (from the PokemonTCG open dataset) — no live price source was reachable or configured, so they're priced from a disclosed rarity-tier model instead."
    >
      Demo data
    </span>
  );
}

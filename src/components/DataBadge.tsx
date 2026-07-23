export function DataBadge({ isLive }: { isLive: boolean }) {
  if (isLive) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-text-secondary">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--good)" }} />
        Live TCGPlayer data
      </span>
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      title="Live pokemontcg.io access wasn't reachable, so this index is priced from a bundled reference dataset and an illustrative trend."
    >
      Demo data
    </span>
  );
}

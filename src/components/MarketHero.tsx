import { Delta } from "./Delta";
import { DataBadge } from "./DataBadge";
import { formatCompactUsd } from "@/lib/format";
import type { MarketOverview } from "@/lib/indices";

export function MarketHero({ overview }: { overview: MarketOverview }) {
  return (
    <section className="rounded-2xl border border-border bg-surface px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
          Pokémon TCG Composite · modern era (2020–present)
        </span>
        <DataBadge isLive={overview.isLive} />
      </div>
      <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
        <span className="text-4xl font-semibold tabular-nums tracking-tight text-text-primary sm:text-5xl">
          {formatCompactUsd(overview.totalValue)}
        </span>
        <Delta value={overview.change7d} size="lg" />
        <span className="mb-1 text-xs text-text-muted">past 7 days</span>
      </div>
      <p className="mt-3 text-sm text-text-secondary">
        Total near-mint market value tracked across {overview.indexCount} indices and {overview.cardCount} modern chase cards.
      </p>
    </section>
  );
}

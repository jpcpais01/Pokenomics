import Link from "next/link";
import { Delta } from "./Delta";
import { Sparkline } from "./Sparkline";
import { formatUsd } from "@/lib/format";
import type { IndexSummary } from "@/lib/types";

export function IndexRow({ index }: { index: IndexSummary }) {
  const sparkData = index.history.slice(-30);
  return (
    <Link
      href={`/index/${index.type}/${index.id}`}
      className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-border hover:bg-surface active:bg-surface"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-bold text-accent">
        {index.ticker.slice(0, 4)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-text-primary">{index.name}</div>
        <div className="truncate text-xs text-text-muted">{index.cards.length} cards · {index.ticker}</div>
      </div>
      <div className="hidden shrink-0 sm:block">
        <Sparkline data={sparkData} positive={index.change7d >= 0} />
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold tabular-nums text-text-primary">{formatUsd(index.value)}</div>
        <Delta value={index.change7d} />
      </div>
    </Link>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { CardRow } from "@/components/CardRow";
import { DataBadge } from "@/components/DataBadge";
import { Delta } from "@/components/Delta";
import { PriceChart } from "@/components/PriceChart";
import { StatGrid, StatTile } from "@/components/StatGrid";
import { estimateCardChange } from "@/lib/history";
import { formatUsd } from "@/lib/format";
import { getPokemonIndex, getSetIndex } from "@/lib/indices";

export const revalidate = 3600;

type Params = { type: string; id: string };

async function loadIndex(type: string, id: string) {
  if (type === "set") return getSetIndex(id);
  if (type === "pokemon") return getPokemonIndex(id);
  return null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { type, id } = await params;
  const index = await loadIndex(type, id);
  if (!index) return { title: "Not found — Pokenomics" };
  return {
    title: `${index.name} (${index.ticker}) — Pokenomics`,
    description: `${index.name} near-mint price index: ${formatUsd(index.value)}, ${index.cards.length} tracked cards.`,
  };
}

export default async function IndexDetailPage({ params }: { params: Promise<Params> }) {
  const { type, id } = await params;
  const index = await loadIndex(type, id);
  if (!index) notFound();

  const constituents = index.cards
    .map((card) => ({ card, change: estimateCardChange(card.id, card.price, 7) }))
    .sort((a, b) => b.card.price - a.card.price);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-text-primary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Markets
      </Link>

      <section>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-muted">{index.ticker}</span>
              <span className="text-xs text-text-muted">·</span>
              <span className="text-xs text-text-muted">{index.subtitle}</span>
            </div>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-text-primary">{index.name}</h1>
          </div>
          <DataBadge isLive={index.isLive} />
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
          <span className="text-4xl font-semibold tabular-nums tracking-tight text-text-primary">{formatUsd(index.value)}</span>
          <Delta value={index.change1d} size="lg" />
          <span className="mb-1 text-xs text-text-muted">today</span>
        </div>

        <div className="mt-3 flex gap-4 text-xs text-text-secondary">
          <span>
            7D <Delta value={index.change7d} />
          </span>
          <span>
            30D <Delta value={index.change30d} />
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <PriceChart history={index.history} />
      </section>

      <section>
        <h2 className="px-1 pb-2 text-sm font-semibold text-text-primary">Index statistics</h2>
        <StatGrid>
          <StatTile label="Total basket value" value={formatUsd(index.totalValue)} sub="Sum of all constituents" />
          <StatTile label="Constituents" value={index.cards.length} sub="Cards tracked" />
          <StatTile label="All-time high" value={formatUsd(index.allTimeHigh)} />
          <StatTile label="All-time low" value={formatUsd(index.allTimeLow)} />
          <StatTile
            label="Top gainer · 7D"
            value={index.topGainer ? index.topGainer.card.name : "—"}
            sub={index.topGainer ? <Delta value={index.topGainer.change7d} /> : undefined}
          />
          <StatTile
            label="Top loser · 7D"
            value={index.topLoser ? index.topLoser.card.name : "—"}
            sub={index.topLoser ? <Delta value={index.topLoser.change7d} /> : undefined}
          />
        </StatGrid>
      </section>

      <section>
        <h2 className="px-1 pb-1 text-sm font-semibold text-text-primary">Constituents</h2>
        <p className="px-1 pb-2 text-xs text-text-secondary">Near-mint TCGPlayer market price, sorted highest to lowest.</p>
        <div className="rounded-2xl border border-border bg-surface px-4">
          {constituents.map(({ card, change }) => (
            <CardRow key={card.id} card={card} change={change} />
          ))}
        </div>
      </section>
    </div>
  );
}

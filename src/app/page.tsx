import Link from "next/link";
import { Delta } from "@/components/Delta";
import { MarketExplorer } from "@/components/MarketExplorer";
import { MarketHero } from "@/components/MarketHero";
import { formatUsd } from "@/lib/format";
import { getAllPokemonIndices, getAllSetIndices, summarizeMarket } from "@/lib/indices";
import type { IndexSummary } from "@/lib/types";

export const revalidate = 3600;

export default async function HomePage() {
  const [setIndices, pokemonIndices] = await Promise.all([getAllSetIndices(), getAllPokemonIndices()]);
  const overview = summarizeMarket([...setIndices, ...pokemonIndices]);

  const movers = [...setIndices, ...pokemonIndices].filter((i) => i.cards.length > 0).sort((a, b) => b.change7d - a.change7d);
  const gainers = movers.slice(0, 3);
  const losers = movers.slice(-3).reverse();

  return (
    <div className="flex flex-col gap-6">
      <MarketHero overview={overview} />

      <section>
        <h2 className="px-1 text-sm font-semibold text-text-primary">Top movers · 7D</h2>
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
          {gainers.map((i) => (
            <MoverChip key={i.id} index={i} />
          ))}
          {losers.map((i) => (
            <MoverChip key={i.id} index={i} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="px-1 text-sm font-semibold text-text-primary">Indices</h2>
        <p className="px-1 pb-2 text-xs text-text-secondary">
          Curated baskets of modern chase cards — by set release, and by Pokémon across every 2020+ set.
        </p>
        <MarketExplorer setIndices={setIndices} pokemonIndices={pokemonIndices} />
      </section>
    </div>
  );
}

function MoverChip({ index }: { index: IndexSummary }) {
  return (
    <Link
      href={`/index/${index.type}/${index.id}`}
      className="flex min-w-[128px] shrink-0 flex-col gap-1 rounded-xl border border-border bg-surface px-3.5 py-3 hover:border-border-strong"
    >
      <span className="truncate text-xs font-semibold text-text-primary">{index.ticker}</span>
      <span className="text-sm font-semibold tabular-nums text-text-primary">{formatUsd(index.value)}</span>
      <Delta value={index.change7d} />
    </Link>
  );
}

"use client";

import { useMemo, useState } from "react";
import { IndexRow } from "./IndexRow";
import type { IndexSummary } from "@/lib/types";

type Tab = "set" | "pokemon";

export function MarketExplorer({ setIndices, pokemonIndices }: { setIndices: IndexSummary[]; pokemonIndices: IndexSummary[] }) {
  const [tab, setTab] = useState<Tab>("set");
  const [query, setQuery] = useState("");

  const active = tab === "set" ? setIndices : pokemonIndices;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return active;
    return active.filter((i) => i.name.toLowerCase().includes(q) || i.ticker.toLowerCase().includes(q));
  }, [active, query]);

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex shrink-0 gap-1 rounded-full bg-surface p-1">
          <TabButton active={tab === "set"} onClick={() => setTab("set")}>
            Sets
          </TabButton>
          <TabButton active={tab === "pokemon"} onClick={() => setTab("pokemon")}>
            Pokémon
          </TabButton>
        </div>
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" stroke="var(--text-muted)" strokeWidth="2" />
            <path d="M20 20L16.5 16.5" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search index or ticker"
            className="w-full rounded-full border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-0.5">
        {filtered.length === 0 && <p className="px-3 py-8 text-center text-sm text-text-muted">No indices match “{query}”.</p>}
        {filtered
          .slice()
          .sort((a, b) => b.totalValue - a.totalValue)
          .map((index) => (
            <IndexRow key={index.id} index={index} />
          ))}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        active ? "bg-text-primary text-page" : "text-text-secondary"
      }`}
    >
      {children}
    </button>
  );
}

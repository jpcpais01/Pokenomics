import { Delta } from "./Delta";
import { SET_DEFS } from "@/lib/fixtures";
import { formatUsd } from "@/lib/format";
import type { Card } from "@/lib/types";

// Keyed on the real rarity strings from PokemonTCG/pokemon-tcg-data.
const RARITY_COLORS: Record<string, string> = {
  "Special Illustration Rare": "#e87ba4",
  "Hyper Rare": "#e87ba4",
  "Mega Hyper Rare": "#e87ba4",
  "Rare Secret": "#4a3aa7",
  "Rare Rainbow": "#4a3aa7",
  "Shiny Ultra Rare": "#4a3aa7",
  "Black White Rare": "#0b0b0b",
  "Illustration Rare": "#eda100",
  "Rare Holo VMAX": "#2a78d6",
  "Rare Holo VSTAR": "#2a78d6",
  "Ultra Rare": "#eb6834",
  "Rare Ultra": "#eb6834",
  "Double Rare": "#eb6834",
  "ACE SPEC Rare": "#1baf7a",
  "Amazing Rare": "#1baf7a",
  "Radiant Rare": "#1baf7a",
  "Shiny Rare": "#1baf7a",
  "Rare Holo V": "#898781",
  "Rare Holo": "#898781",
};

const SET_TICKER_BY_ID = new Map(SET_DEFS.map((s) => [s.id, s.ticker]));

export function CardRow({ card, change }: { card: Card; change: number }) {
  const color = RARITY_COLORS[card.rarity] ?? "var(--text-muted)";
  const setTicker = SET_TICKER_BY_ID.get(card.setId) ?? card.setId.slice(0, 3).toUpperCase();
  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-0">
      <div
        className="flex h-11 w-8 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white"
        style={{ background: `linear-gradient(160deg, ${color}, color-mix(in srgb, ${color} 60%, black))` }}
        aria-hidden="true"
      >
        {setTicker.slice(0, 3)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-text-primary">{card.name}</div>
        <div className="truncate text-xs text-text-muted">
          {card.rarity} · #{Number.parseInt(card.number, 10)}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold tabular-nums text-text-primary">{formatUsd(card.price)}</div>
        <Delta value={change} />
      </div>
    </div>
  );
}

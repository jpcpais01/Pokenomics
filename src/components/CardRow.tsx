import { Delta } from "./Delta";
import { formatUsd } from "@/lib/format";
import type { Card } from "@/lib/types";

const RARITY_COLORS: Record<string, string> = {
  "Special Illustration Rare": "#e87ba4",
  "Illustration Rare": "#eda100",
  "Alternate Art": "#4a3aa7",
  "Rainbow Rare": "#e87ba4",
  "Radiant Rare": "#1baf7a",
  "Ultra Rare": "#2a78d6",
  "Full Art": "#eb6834",
  "Holo Rare": "#898781",
};

export function CardRow({ card, change }: { card: Card; change: number }) {
  const color = RARITY_COLORS[card.rarity] ?? "var(--text-muted)";
  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-0">
      <div
        className="flex h-11 w-8 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white"
        style={{ background: `linear-gradient(160deg, ${color}, color-mix(in srgb, ${color} 60%, black))` }}
        aria-hidden="true"
      >
        {card.setId
          .split("-")
          .map((w) => w[0])
          .join("")
          .slice(0, 3)
          .toUpperCase()}
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

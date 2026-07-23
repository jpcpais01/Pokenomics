import { formatPct } from "@/lib/format";

export function Delta({ value, size = "sm" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const up = value > 0;
  const flat = Math.abs(value) < 0.005;
  const sizeClass = size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-xs";
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${sizeClass}`}
      style={{ color: flat ? "var(--text-muted)" : up ? "var(--good)" : "var(--critical)" }}
    >
      {!flat && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" className={up ? "" : "rotate-180"}>
          <path d="M5 8.5V1.5M5 1.5L1.5 5M5 1.5L8.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {formatPct(value)}
    </span>
  );
}

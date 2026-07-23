"use client";

import { useMemo, useRef, useState } from "react";
import { formatShortDate, formatUsd } from "@/lib/format";
import type { HistoryPoint } from "@/lib/types";

const RANGES: { label: string; days: number | null }[] = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
  { label: "ALL", days: null },
];

const W = 640;
const H = 240;
const PAD_X = 8;
const PAD_TOP = 26;
const PAD_BOTTOM = 24;

function niceStep(rough: number): number {
  if (rough <= 0) return 1;
  const exp = Math.floor(Math.log10(rough));
  const base = rough / 10 ** exp;
  const niceBase = base < 1.5 ? 1 : base < 3 ? 2 : base < 7 ? 5 : 10;
  return niceBase * 10 ** exp;
}

export function PriceChart({ history }: { history: HistoryPoint[] }) {
  const [rangeIdx, setRangeIdx] = useState(2); // default 90D
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const range = RANGES[rangeIdx];
  const data = useMemo(() => {
    const full = history;
    if (range.days === null) return full;
    return full.slice(-range.days);
  }, [history, range.days]);

  const periodChange = data.length > 1 ? ((data[data.length - 1].value - data[0].value) / data[0].value) * 100 : 0;
  const positive = periodChange >= -0.005;
  const lineColor = positive ? "var(--good)" : "var(--critical)";

  const { ticks, min, max, points } = useMemo(() => {
    const values = data.map((d) => d.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const step = niceStep((rawMax - rawMin) / 3 || rawMax * 0.1 || 1);
    const tickMin = Math.max(0, Math.floor(rawMin / step) * step);
    const tickMax = Math.ceil(rawMax / step) * step;
    const ticksArr: number[] = [];
    for (let v = tickMin; v <= tickMax + step * 0.001; v += step) ticksArr.push(Math.round(v * 100) / 100);

    const domainMin = tickMin;
    const domainMax = tickMax || 1;
    const innerW = W - PAD_X * 2;
    const innerH = H - PAD_TOP - PAD_BOTTOM;
    const pts = values.map((v, i) => {
      const x = values.length > 1 ? (i / (values.length - 1)) * innerW + PAD_X : PAD_X + innerW / 2;
      const y = PAD_TOP + innerH - ((v - domainMin) / (domainMax - domainMin || 1)) * innerH;
      return { x, y, v };
    });
    return { ticks: ticksArr, min: domainMin, max: domainMax, points: pts };
  }, [data]);

  function updateHoverFromClientX(clientX: number) {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const idx = Math.round(fraction * (points.length - 1));
    setHoverIdx(idx);
  }

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${H - PAD_BOTTOM} L${points[0].x.toFixed(1)},${H - PAD_BOTTOM} Z`
      : "";

  const hover = hoverIdx !== null ? points[hoverIdx] : null;
  const hoverPoint = hoverIdx !== null ? data[hoverIdx] : null;
  const tooltipLeft = hover ? hover.x / W > 0.66 : false;

  return (
    <div>
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto pb-1">
        {RANGES.map((r, i) => (
          <button
            key={r.label}
            type="button"
            onClick={() => {
              setRangeIdx(i);
              setHoverIdx(null);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              i === rangeIdx ? "bg-text-primary text-page" : "text-text-secondary hover:bg-surface-raised"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="relative mt-1 select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          width="100%"
          height={220}
          className="touch-pan-y"
          onPointerMove={(e) => updateHoverFromClientX(e.clientX)}
          onPointerDown={(e) => updateHoverFromClientX(e.clientX)}
          onPointerLeave={() => setHoverIdx(null)}
          role="img"
          aria-label={`Index value chart, ${range.label} range, currently ${data.length ? formatUsd(data[data.length - 1].value) : ""}`}
        >
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.14} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          {ticks.map((t) => {
            const y = PAD_TOP + (H - PAD_TOP - PAD_BOTTOM) - ((t - min) / (max - min || 1)) * (H - PAD_TOP - PAD_BOTTOM);
            return (
              <g key={t}>
                <line x1={PAD_X} x2={W - PAD_X} y1={y} y2={y} stroke="var(--gridline)" strokeWidth={1} />
                <text x={W} y={y - 4} textAnchor="end" fontSize={10} fill="var(--text-muted)">
                  {formatUsd(t)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#areaFill)" />
          <path d={linePath} fill="none" stroke={lineColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {points.length > 0 && (
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={4} fill={lineColor} stroke="var(--surface)" strokeWidth={2} />
          )}

          {hover && (
            <g>
              <line x1={hover.x} x2={hover.x} y1={PAD_TOP} y2={H - PAD_BOTTOM} stroke="var(--baseline)" strokeWidth={1} />
              <circle cx={hover.x} cy={hover.y} r={4.5} fill={lineColor} stroke="var(--surface)" strokeWidth={2} />
            </g>
          )}
        </svg>

        {hover && hoverPoint && (
          <div
            className="pointer-events-none absolute top-1 rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 shadow-sm"
            style={{
              left: `${(hover.x / W) * 100}%`,
              transform: tooltipLeft ? "translateX(calc(-100% - 10px))" : "translateX(10px)",
            }}
          >
            <div className="text-sm font-semibold tabular-nums text-text-primary">{formatUsd(hoverPoint.value)}</div>
            <div className="text-[11px] text-text-muted">{formatShortDate(hoverPoint.date)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

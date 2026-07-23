import fs from "node:fs";
import path from "node:path";
import type { HistoryPoint } from "./types";

// ---------------------------------------------------------------------------
// Historical price series for an index.
//
// pokemontcg.io (and every free card-price source) only exposes a *current*
// snapshot, not a real time series. So history here has two layers:
//
//  1. A deterministic, seeded backfill anchored to today's real computed
//     index value — same inputs always produce the same chart, and the
//     rightmost point is always the live figure. This is what renders until
//     real data accumulates.
//  2. Real daily snapshots recorded by scripts/snapshot.mjs (run on a cron,
//     see .github/workflows/snapshot.yml) into data/history/<id>.json. Once
//     present, real points replace the backfill for the dates they cover.
// ---------------------------------------------------------------------------

const MAX_BACKFILL_DAYS = 730;
const DAY_MS = 86_400_000;

function hashSeed(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Deterministic seeded random walk in USD, ending exactly at `endValue` today. */
function backfill(seedKey: string, endValue: number, days: number): HistoryPoint[] {
  const n = Math.max(2, days);
  const rng = mulberry32(hashSeed(seedKey));
  const DRIFT = 0.0011; // slight upward drift — collectibles trending up over the window
  const SIGMA = 0.021;
  const levels = new Array<number>(n);
  levels[0] = 1;
  for (let i = 1; i < n; i++) {
    let r = DRIFT + SIGMA * gaussian(rng);
    if (rng() < 0.025) r += (rng() < 0.5 ? -1 : 1) * (0.05 + rng() * 0.07); // hype/dump shock
    r = Math.max(-0.16, Math.min(0.16, r));
    levels[i] = levels[i - 1] * (1 + r);
  }
  const scale = endValue / levels[n - 1];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return levels.map((lvl, i) => {
    const d = new Date(today.getTime() - (n - 1 - i) * DAY_MS);
    return { date: isoDate(d), value: Math.max(0.01, Math.round(lvl * scale * 100) / 100) };
  });
}

function readRealSnapshots(indexId: string): HistoryPoint[] {
  try {
    const file = path.join(process.cwd(), "data", "history", `${indexId}.json`);
    const raw = fs.readFileSync(file, "utf-8");
    const parsed = JSON.parse(raw) as HistoryPoint[];
    return Array.isArray(parsed) ? parsed.filter((p) => typeof p.value === "number" && typeof p.date === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Full history for an index: seeded backfill up to the first real snapshot
 * (or through today if none exist), then real recorded snapshots layered on
 * top, always ending at `currentValue`.
 */
export function buildHistory(indexId: string, currentValue: number, sinceDate: string): HistoryPoint[] {
  const real = readRealSnapshots(indexId).sort((a, b) => a.date.localeCompare(b.date));
  const since = new Date(sinceDate + "T00:00:00Z");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const daysSinceRelease = Math.max(2, Math.round((today.getTime() - since.getTime()) / DAY_MS) + 1);
  const days = Math.min(MAX_BACKFILL_DAYS, daysSinceRelease);

  const anchor = real.length > 0 ? real[0].value : currentValue;
  const filledDays = real.length > 0 ? Math.min(days, MAX_BACKFILL_DAYS) : days;
  const fill = backfill(indexId, anchor, filledDays);

  if (real.length === 0) return fill;

  const cutoff = real[0].date;
  const merged = [...fill.filter((p) => p.date < cutoff), ...real];
  // Force the final point to the authoritative current value.
  if (merged.length > 0) merged[merged.length - 1] = { date: merged[merged.length - 1].date, value: currentValue };
  return merged;
}

export function sliceRange(history: HistoryPoint[], days: number | null): HistoryPoint[] {
  if (days === null) return history;
  return history.slice(-days);
}

export function valueDaysAgo(history: HistoryPoint[], days: number): number | null {
  if (history.length === 0) return null;
  const idx = history.length - 1 - days;
  if (idx < 0) return history[0].value;
  return history[idx].value;
}

export function pctChange(from: number | null, to: number): number {
  if (from === null || from === 0) return 0;
  return ((to - from) / from) * 100;
}

/** Same seeded-backfill model, used per-card so constituent rows can show a period change. */
export function estimateCardChange(cardId: string, price: number, days: number): number {
  const series = backfill(cardId, price, days + 1);
  return pctChange(series[0].value, series[series.length - 1].value);
}

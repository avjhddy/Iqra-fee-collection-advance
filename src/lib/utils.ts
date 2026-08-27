import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/* ---------------------------- money / numbers ----------------------------- */

export const DEFAULT_SYMBOL = "Rs.";

export function formatMoney(value: number | null | undefined, symbol = DEFAULT_SYMBOL) {
  const n = Number(value ?? 0);
  const sign = n < 0 ? "-" : "";
  return `${sign}${symbol} ${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
}

export function formatShortMoney(value: number | null | undefined, symbol = DEFAULT_SYMBOL) {
  const n = Number(value ?? 0);
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${symbol} ${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${sign}${symbol} ${(abs / 1_000).toFixed(abs >= 100_000 ? 0 : 1)}k`;
  return `${sign}${symbol} ${abs}`;
}

export function formatNumber(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("en-US");
}

export function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((Number(part) / Number(whole)) * 1000) / 10;
}

/* --------------------------------- dates ---------------------------------- */

export function todayYmd() {
  return toYmd(new Date());
}

export function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYmd(s: string) {
  const [y, m, d] = s.split("-").map((x) => Number(x));
  return new Date(y, (m || 1) - 1, d || 1);
}

/** 'YYYY-MM' for a 'YYYY-MM-DD' string */
export function ymOf(ymd: string) {
  return ymd.slice(0, 7);
}

export function currentYm() {
  return ymOf(todayYmd());
}

export function ymShift(ym: string, delta: number) {
  const [y, m] = ym.split("-").map((x) => Number(x));
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${`${nm}`.padStart(2, "0")}`;
}

export function ymIndex(ym: string) {
  const [y, m] = ym.split("-").map((x) => Number(x));
  return y * 12 + (m - 1);
}

export function monthsBetween(fromYmdValue: string, toYmdValue: string) {
  // inclusive month count, never negative
  const a = ymIndex(ymOf(fromYmdValue));
  const b = ymIndex(ymOf(toYmdValue));
  return Math.max(0, b - a + 1);
}

export function ymStart(ym: string) {
  return `${ym}-01`;
}

export function ymEnd(ym: string) {
  const [y, m] = ym.split("-").map((x) => Number(x));
  const last = new Date(y, m, 0).getDate();
  return `${ym}-${`${last}`.padStart(2, "0")}`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function ymLabel(ym: string, short = false) {
  const [y, m] = ym.split("-").map((x) => Number(x));
  const name = MONTHS[Math.min(11, Math.max(0, (m || 1) - 1))];
  return short ? `${name.slice(0, 3)} ${String(y).slice(2)}` : `${name} ${y}`;
}

export function dateLabel(ymd: string | null | undefined) {
  if (!ymd) return "—";
  const d = parseYmd(ymd.slice(0, 10));
  if (Number.isNaN(d.getTime())) return ymd;
  return `${`${d.getDate()}`.padStart(2, "0")} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

export function shiftYmd(ymd: string, days: number) {
  const d = parseYmd(ymd);
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

export function lastMonths(ym: string, count: number) {
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) out.push(ymShift(ym, -i));
  return out;
}

/* --------------------------------- misc ----------------------------------- */

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function titleCase(s: string) {
  return s.replace(/(^|\s)\w/g, (m) => m.toUpperCase());
}

"use client";

import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button, EmptyState, SearchBox, SelectInput } from "@/components/ui";

export type Column<T> = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  width?: string;
  hideBelow?: "md" | "lg";
  render?: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
};

type Props<T> = {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  pageSize?: number;
  initialSort?: { key: string; dir: "asc" | "desc" };
  onRowClick?: (row: T) => void;
  toolbar?: ReactNode;
  searchPrompt?: string;
  empty?: { title: string; hint?: string; action?: ReactNode };
  summary?: (rows: T[]) => ReactNode;
  dense?: boolean;
  activeRow?: (row: T) => boolean;
};

export function DataTable<T extends Record<string, unknown>>({
  rows,
  columns,
  rowKey,
  pageSize = 10,
  initialSort,
  onRowClick,
  toolbar,
  searchPrompt = "Search table…",
  empty,
  summary,
  dense = false,
}: Props<T>) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(pageSize);

  const colMap = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const needle = q.trim().toLowerCase();
    return rows.filter((row) =>
      columns.some((c) => {
        const raw = sortValueOf(row, c);
        return raw !== null && String(raw).toLowerCase().includes(needle);
      }),
    );
  }, [rows, q, columns]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = colMap.get(sort.key);
    if (!col) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = sortValueOf(a, col);
      const bv = sortValueOf(b, col);
      if (typeof av === "number" && typeof bv === "number") return sort.dir === "asc" ? av - bv : bv - av;
      const as = String(av ?? "").toLowerCase();
      const bs = String(bv ?? "").toLowerCase();
      if (as === bs) return 0;
      return (sort.dir === "asc" ? 1 : -1) * (as < bs ? -1 : 1);
    });
    return copy;
  }, [filtered, sort, colMap]);

  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const current = Math.min(page, pages - 1);
  const view = sorted.slice(current * size, current * size + size);

  const toggle = (key: string) =>
    setSort((prev) =>
      !prev || prev.key !== key ? { key, dir: "asc" } : prev.dir === "asc" ? { key, dir: "desc" } : { key, dir: "asc" },
    );

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder={searchPrompt} className="w-full sm:max-w-xs" />
        {toolbar}
        <span className="ml-auto text-[11px] font-medium text-ink-500 dark:text-ink-400">
          {sorted.length.toLocaleString()} record{sorted.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink-200 dark:border-ink-800">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-ink-50/95 backdrop-blur dark:bg-ink-950/85">
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    style={c.width ? { width: c.width } : undefined}
                    className={cn(
                      "whitespace-nowrap border-b border-ink-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500 dark:border-ink-800 dark:text-ink-400",
                      c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left",
                      c.hideBelow === "md" && "hidden md:table-cell",
                      c.hideBelow === "lg" && "hidden lg:table-cell",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(c.key)}
                      className={cn(
                        "inline-flex items-center gap-1 transition-colors hover:text-brand-600",
                        active && "text-brand-700 dark:text-brand-300",
                      )}
                      title={`Sort by ${c.label}`}
                    >
                      {c.label}
                      <span className={cn("text-[9px]", active ? "opacity-100" : "opacity-30")}>
                        {active ? (sort?.dir === "asc" ? "▲" : "▼") : "▲"}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {view.map((row, i) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-ink-100 bg-white transition-colors last:border-0 dark:border-ink-800/70 dark:bg-ink-900",
                  i % 2 === 1 && "bg-ink-50/60 dark:bg-ink-900/50",
                  onRowClick && "cursor-pointer hover:bg-brand-50/70 dark:hover:bg-brand-900/20",
                )}
              >
                {columns.map((c) => {
                  const value = c.render ? c.render(row) : String(row[c.key] ?? "—");
                  return (
                    <td
                      key={c.key}
                      className={cn(
                        dense ? "px-3 py-1.5" : "px-3 py-2.5",
                        "align-middle text-ink-700 dark:text-ink-200",
                        c.align === "right" ? "text-right tabular-nums" : c.align === "center" ? "text-center" : "text-left",
                        c.hideBelow === "md" && "hidden md:table-cell",
                        c.hideBelow === "lg" && "hidden lg:table-cell",
                        c.className,
                      )}
                    >
                      {value as ReactNode}
                    </td>
                  );
                })}
              </tr>
            ))}
            {!view.length ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6">
                  {empty ? (
                    <EmptyState title={empty.title} hint={empty.hint} action={empty.action} />
                  ) : (
                    <p className="text-center text-sm text-ink-500">No records match this filter.</p>
                  )}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {summary ? <div className="rounded-xl bg-ink-50 px-3 py-2 text-xs dark:bg-ink-800/50">{summary(sorted)}</div> : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] text-ink-500 dark:text-ink-400">
          <span>Rows</span>
          <SelectInput value={String(size)} onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }} className="!w-auto !py-1 text-xs">
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </SelectInput>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setPage(0)} disabled={current === 0}>First</Button>
          <Button size="sm" variant="outline" onClick={() => setPage(current - 1)} disabled={current === 0}>← Prev</Button>
          <span className="px-2 text-xs font-semibold tabular-nums text-ink-600 dark:text-ink-300">
            Page {current + 1} / {pages}
          </span>
          <Button size="sm" variant="outline" onClick={() => setPage(current + 1)} disabled={current >= pages - 1}>Next →</Button>
        </div>
      </div>
    </div>
  );
}

function sortValueOf<T extends Record<string, unknown>>(row: T, col: Column<T>) {
  if (col.sortValue) return col.sortValue(row);
  const v = row[col.key];
  if (v === null || v === undefined) return null;
  if (typeof v === "number" || typeof v === "string") return v;
  return String(v);
}

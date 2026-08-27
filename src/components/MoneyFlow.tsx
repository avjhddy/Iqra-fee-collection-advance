"use client";

import { useApp } from "@/components/Providers";
import { cn, formatMoney } from "@/lib/utils";

type Flow = { opening: number; in: number; salaries: number; expenses: number; balance: number };

function Node({
  label,
  value,
  tone,
  sub,
  className,
}: {
  label: string;
  value: number;
  tone: "in" | "school" | "salaries" | "expenses" | "balance";
  sub?: string;
  className?: string;
}) {
  const { symbol } = useApp();
  const styles = {
    in: "border-emerald-300/70 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/10",
    school: "border-brand-400/70 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-900/30",
    salaries: "border-sky-300/70 bg-sky-50 dark:border-sky-500/25 dark:bg-sky-500/10",
    expenses: "border-amber-300/70 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/10",
    balance: "border-violet-300/70 bg-violet-50 dark:border-violet-500/25 dark:bg-violet-500/10",
  }[tone];
  const text = {
    in: "text-emerald-700 dark:text-emerald-300",
    school: "text-brand-700 dark:text-brand-300",
    salaries: "text-sky-700 dark:text-sky-300",
    expenses: "text-amber-700 dark:text-amber-300",
    balance: "text-violet-700 dark:text-violet-300",
  }[tone];
  return (
    <div className={cn("rounded-xl border px-3 py-2.5 transition-transform duration-200 hover:-translate-y-0.5", styles, className)}>
      <p className="text-[10.5px] font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">{label}</p>
      <p className={cn("mt-0.5 text-[15px] font-extrabold tabular-nums leading-tight", text)}>{formatMoney(value, symbol)}</p>
      {sub ? <p className="mt-0.5 text-[10.5px] text-ink-500 dark:text-ink-400">{sub}</p> : null}
    </div>
  );
}

function Arrow({ direction = "right", active }: { direction?: "right" | "down"; active?: boolean }) {
  return (
    <div className={cn("flex items-center justify-center px-1 py-0.5", direction === "down" && "rotate-90")}>
      <svg viewBox="0 0 60 16" className="h-4 w-10 text-brand-500 sm:w-14" fill="none" aria-hidden>
        <path
          d="M2 8h48"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 5"
          className={active ? "animate-[dash_1.1s_linear_infinite]" : "opacity-60"}
        />
        <path d="M50 3l7 5-7 5z" fill="currentColor" />
      </svg>
    </div>
  );
}

export function MoneyFlow({ flow, label }: { flow: Flow; label?: string }) {
  const { symbol, money } = useApp();
  const out = flow.salaries + flow.expenses;
  const total = Math.max(1, flow.in + out + Math.abs(flow.balance));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 items-stretch gap-1.5 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
        <Node
          label="1 · Student Fees"
          value={flow.in}
          tone="in"
          sub={label ? `Collected · ${label}` : "Money IN"}
        />
        <Arrow active />
        <Node label="2 · School Money" value={flow.opening + flow.in} tone="school" sub={`Opening fund ${formatMoney(flow.opening, symbol)} + fees`} />
        <Arrow active />
        <div className="grid gap-1.5">
          <Node label="3a · Teacher Salaries" value={flow.salaries} tone="salaries" sub="Money OUT" />
          <Node label="3b · Other Expenses" value={flow.expenses} tone="expenses" sub="Money OUT" />
        </div>
        <Arrow active />
        <Node label="4 · Current Balance" value={flow.balance} tone="balance" sub={`Money out so far ${formatMoney(out, symbol)}`} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-ink-100/70 px-3 py-2 text-[11px] font-medium text-ink-600 dark:bg-ink-800/50 dark:text-ink-300">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> In {money(flow.in)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Out {money(out)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-violet-500" /> Balance {money(flow.balance)}
        </span>
        <div className="ml-auto flex h-2 w-full max-w-[220px] overflow-hidden rounded-full bg-ink-200 dark:bg-ink-700">
          <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${(flow.in / total) * 100}%` }} />
          <div className="h-full bg-sky-500 transition-all duration-700" style={{ width: `${(flow.salaries / total) * 100}%` }} />
          <div className="h-full bg-amber-500 transition-all duration-700" style={{ width: `${(flow.expenses / total) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

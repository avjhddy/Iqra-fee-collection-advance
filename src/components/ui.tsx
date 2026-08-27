"use client";

import {
  useEffect,
  useId,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn, formatMoney as fmt, initials } from "@/lib/utils";
import { getAttachmentDataUrl } from "@/lib/api";

/* --------------------------------- surfaces -------------------------------- */

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return <section className={cn("card", padded && "p-4 sm:p-5", className)}>{children}</section>;
}

export function SectionTitle({
  title,
  subtitle,
  right,
  icon,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-ink-900 dark:text-ink-50">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{subtitle}</p> : null}
        </div>
      </div>
      {right ? <div className="flex flex-wrap items-center gap-2">{right}</div> : null}
    </div>
  );
}

export function Panel({ title, children, right, className }: { title: string; children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink-800 dark:text-ink-100">{title}</h3>
        {right}
      </div>
      {children}
    </Card>
  );
}

/* --------------------------------- buttons --------------------------------- */

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger" | "soft";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  loading?: boolean;
};

export function Button({ variant = "primary", size = "md", icon, loading, className, children, ...rest }: BtnProps) {
  const styles = {
    primary:
      "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm shadow-brand-600/20 disabled:bg-brand-600/50",
    soft: "bg-brand-50 text-brand-800 hover:bg-brand-100 dark:bg-brand-900/40 dark:text-brand-200 dark:hover:bg-brand-900/60",
    outline:
      "border border-ink-200 bg-white text-ink-700 hover:border-brand-400 hover:text-brand-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100 dark:hover:border-brand-500",
    ghost: "text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20",
  }[variant];
  const sizes = { sm: "px-2.5 py-1.5 text-xs gap-1.5", md: "px-3.5 py-2 text-sm gap-2", lg: "px-5 py-2.5 text-sm gap-2" }[size];
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 disabled:cursor-not-allowed disabled:opacity-60",
        styles,
        sizes,
        className,
      )}
    >
      {loading ? <Spinner className="h-3.5 w-3.5" /> : icon}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------------------------- badges --------------------------------- */

export type Tone = "green" | "red" | "amber" | "blue" | "slate" | "violet";

const tones: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  red: "bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20",
  slate: "bg-ink-100 text-ink-600 ring-ink-500/10 dark:bg-ink-800 dark:text-ink-300 dark:ring-ink-600/30",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20",
};

export function Badge({ tone = "slate", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: "paid" | "partial" | "unpaid" | string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    paid: { tone: "green", label: "Paid" },
    partial: { tone: "amber", label: "Partial" },
    unpaid: { tone: "red", label: "Not Paid" },
    "not-paid": { tone: "red", label: "Not Paid" },
    active: { tone: "green", label: "Active" },
    inactive: { tone: "slate", label: "Archived" },
    graduated: { tone: "blue", label: "Passed Out" },
    void: { tone: "slate", label: "Void" },
  };
  const it = map[status] ?? { tone: "slate" as Tone, label: status };
  return <Badge tone={it.tone}>{it.label}</Badge>;
}

export function Avatar({
  name,
  photoId,
  size = 36,
  className,
}: {
  name: string;
  photoId?: number | null;
  size?: number;
  className?: string;
}) {
  const label = initials(name) || "?";
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (photoId) void getAttachmentDataUrl(photoId).then((url) => { if (alive) setSrc(url); });
    else setSrc(null);
    return () => { alive = false; };
  }, [photoId]);
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-semibold text-white ring-1 ring-white/40",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
    >
      {photoId ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src || undefined} alt={name} className="h-full w-full object-cover" />
      ) : (
        label
      )}
    </span>
  );
}

/* ---------------------------------- KPI ------------------------------------ */

export function TrendPill({ trend, invert = false }: { trend?: { pct: number; dir: string; diff: number }; invert?: boolean }) {
  if (!trend) return <span className="text-[11px] text-ink-400">no previous data</span>;
  const positive = invert ? trend.diff < 0 : trend.diff > 0;
  const flat = trend.diff === 0;
  const arrow = flat ? "→" : trend.dir === "up" ? "▲" : "▼";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
        flat
          ? "bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400"
          : positive
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
            : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
      )}
      title="Compared with the previous period of the same length"
    >
      <span aria-hidden>{arrow}</span>
      {flat ? "no change" : `${Math.abs(trend.pct)}%`}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "slate",
  trend,
  invertTrend,
  icon,
  onClick,
  progress,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  trend?: { pct: number; dir: string; diff: number };
  invertTrend?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
  progress?: number;
}) {
  const accent = {
    green: "from-emerald-500/15 to-emerald-500/0 text-emerald-600 dark:text-emerald-300",
    red: "from-rose-500/15 to-rose-500/0 text-rose-600 dark:text-rose-300",
    amber: "from-amber-500/15 to-amber-500/0 text-amber-600 dark:text-amber-300",
    blue: "from-sky-500/15 to-sky-500/0 text-sky-600 dark:text-sky-300",
    violet: "from-violet-500/15 to-violet-500/0 text-violet-600 dark:text-violet-300",
    slate: "from-brand-500/15 to-brand-500/0 text-brand-600 dark:text-brand-300",
  }[tone];
  return (
    <div
      onClick={onClick}
      className={cn(
        "card group relative overflow-hidden p-4 transition-all duration-200",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink-900/5",
      )}
    >
      <div className={cn("pointer-events-none absolute inset-x-0 -top-10 h-24 bg-gradient-to-b blur-lg", accent)} />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">{label}</p>
        {icon ? <span className={cn("shrink-0", accent.split(" ").pop())}>{icon}</span> : null}
      </div>
      <p className="relative mt-1.5 text-xl font-bold tabular-nums tracking-tight text-ink-900 dark:text-white sm:text-[22px]">
        {value}
      </p>
      <div className="relative mt-2 flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[11px] text-ink-500 dark:text-ink-400">{hint}</span>
        {trend ? <TrendPill trend={trend} invert={invertTrend} /> : null}
      </div>
      {typeof progress === "number" ? (
        <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-700"
            style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------------- inputs --------------------------------- */

export function Field({
  label,
  hint,
  children,
  required,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-ink-400">{hint}</span> : null}
    </label>
  );
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cn("input-base", className)} />;
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={cn("input-base min-h-[68px] resize-y", className)} />;
}

export function SelectInput({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...rest} className={cn("input-base appearance-none pr-8", className)}>
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function Money({ value, className, symbol }: { value: number | null | undefined; className?: string; symbol?: string }) {
  return <span className={cn("tabular-nums", className)}>{fmt(Number(value ?? 0), symbol)}</span>;
}

export function SearchBox({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <svg className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-base pl-8"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-1 text-ink-400 hover:text-ink-700 dark:hover:text-ink-100"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2"
    >
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors duration-200",
          checked ? "bg-brand-600" : "bg-ink-300 dark:bg-ink-700",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200",
            checked ? "left-4.5" : "left-0.5",
          )}
        />
      </span>
      {label ? <span className="text-xs font-medium text-ink-600 dark:text-ink-300">{label}</span> : null}
    </button>
  );
}

/* ---------------------------------- modal ---------------------------------- */

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = "max-w-2xl",
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/45 p-3 backdrop-blur-sm sm:p-6">
      <div className={cn("card animate-pop my-auto w-full p-0 shadow-2xl", width)} onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start justify-between gap-3 border-b border-ink-100 px-5 py-3.5 dark:border-ink-800">
          <div>
            <h3 className="text-[15px] font-semibold text-ink-900 dark:text-ink-50">{title}</h3>
            {subtitle ? <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-100"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-ink-100 px-5 py-3 dark:border-ink-800">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

export function Confirm({
  open,
  title,
  message,
  confirmLabel = "Yes, continue",
  requireText,
  onCancel,
  onConfirm,
  tone = "danger",
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  requireText?: string;
  onCancel: () => void;
  onConfirm: () => void;
  tone?: "danger" | "primary";
}) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (open) setText("");
  }, [open]);
  const ready = !requireText || text.trim().toUpperCase() === requireText.toUpperCase();
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      width="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} disabled={!ready} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-ink-600 dark:text-ink-300">
        <div>{message}</div>
        {requireText ? (
          <Field label={`Type ${requireText} to confirm`}>
            <TextInput value={text} onChange={(e) => setText(e.target.value)} placeholder={requireText} />
          </Field>
        ) : null}
      </div>
    </Modal>
  );
}

/* ---------------------------------- misc ----------------------------------- */

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-200 px-6 py-10 text-center dark:border-ink-700">
      <svg viewBox="0 0 48 48" className="h-9 w-9 text-ink-300 dark:text-ink-600" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="7" y="12" width="34" height="26" rx="4" />
        <path d="M7 20h34M16 28h16" strokeLinecap="round" />
      </svg>
      <p className="text-sm font-semibold text-ink-700 dark:text-ink-200">{title}</p>
      {hint ? <p className="max-w-md text-xs text-ink-500 dark:text-ink-400">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ProgressBar({
  value,
  tone = "brand",
  label,
  className,
}: {
  value: number;
  tone?: "brand" | "amber" | "rose" | "sky";
  label?: string;
  className?: string;
}) {
  const width = Math.max(1.5, Math.min(100, Number.isFinite(value) ? value : 0));
  const bg = { brand: "bg-brand-500", amber: "bg-amber-500", rose: "bg-rose-500", sky: "bg-sky-500" }[tone];
  return (
    <div className={cn("mt-1.5", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-200/80 dark:bg-ink-800">
        <div className={cn("h-full rounded-full transition-all duration-700 ease-out", bg)} style={{ width: `${width}%` }} />
      </div>
      {label ? <p className="mt-1 text-[10.5px] font-medium text-ink-500 dark:text-ink-400">{label}</p> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-ink-200/60 dark:bg-ink-800", className)} />;
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

/* --------------------------------- tabs ------------------------------------ */

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex flex-wrap gap-1 rounded-xl bg-ink-100 p-1 dark:bg-ink-800/70", className)} role="tablist">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={`${id}-${it.value}`}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150",
              active
                ? "bg-white text-brand-700 shadow-sm dark:bg-ink-900 dark:text-brand-300"
                : "text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100",
            )}
          >
            {it.label}
            {typeof it.count === "number" ? (
              <span className={cn("rounded-full px-1.5 text-[10px]", active ? "bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200" : "bg-ink-200/70 text-ink-500 dark:bg-ink-700")}>
                {it.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function useLocalState<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }, [key, v]);
  return [v, setV] as const;
}

export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>;
}

export function Grid({ children, cols = 4, className }: { children: ReactNode; cols?: 2 | 3 | 4 | 5; className?: string }) {
  const map = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  };
  return <div className={cn('grid grid-cols-1 gap-3', map[cols], className)}>{children}</div>;
}

export function KeyValue({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className='grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3'>
      {items.map((it) => (
        <div key={it.label} className='min-w-0'>
          <dt className='text-[11px] font-semibold uppercase tracking-wide text-ink-400'>{it.label}</dt>
          <dd className='truncate text-sm font-medium text-ink-800 dark:text-ink-100'>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function useSort<T>(rows: T[], initialKey: keyof T | null = null, initialDir: 'asc' | 'desc' = 'asc') {
  const [key, setKey] = useState<keyof T | null>(initialKey);
  const [dir, setDir] = useState<'asc' | 'desc'>(initialDir);
  const sorted = useMemo(() => {
    if (!key) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (typeof av === 'number' && typeof bv === 'number') return dir === 'asc' ? av - bv : bv - av;
      const as = String(av ?? '').toLowerCase();
      const bs = String(bv ?? '').toLowerCase();
      if (as === bs) return 0;
      return (dir === 'asc' ? 1 : -1) * (as < bs ? -1 : 1);
    });
    return copy;
  }, [rows, key, dir]);
  const toggle = (nextKey: keyof T) => {
    if (nextKey === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setKey(nextKey);
      setDir('asc');
    }
  };
  return { sorted, sortKey: key, sortDir: dir, toggle };
}

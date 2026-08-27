"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/components/Providers";
import { Badge, Button, SelectInput, Spinner, TextInput } from "@/components/ui";
import { notifyChange } from "@/lib/api";
import { requestAction } from "@/lib/nav";
import { cn, currentYm, ymShift } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: "grid", hint: "Money at a glance" },
  { href: "/students", label: "Students", icon: "users", hint: "Register once, use forever" },
  { href: "/teachers", label: "Teachers", icon: "teacher", hint: "Staff records" },
  { href: "/fees", label: "Fee Collection", icon: "wallet", hint: "Collect monthly fees" },
  { href: "/salaries", label: "Teacher Salary", icon: "bank", hint: "Pay monthly salary" },
  { href: "/expenses", label: "Other Expenses", icon: "receipt", hint: "School spending" },
  { href: "/reports", label: "Reports", icon: "chart", hint: "PDF & custom date report" },
  { href: "/settings", label: "Settings", icon: "gear", hint: "School details, backup" },
];

function Icon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
        <path d="M16 6.2a3 3 0 0 1 0 5.6M17.5 19a5.4 5.4 0 0 0-2.2-4.3" />
      </>
    ),
    teacher: (
      <>
        <path d="M3 8.5 12 4l9 4.5-9 4.5z" />
        <path d="M7 11v4.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V11" />
      </>
    ),
    wallet: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="3" />
        <path d="M3 10h18M16 14.5h2" />
      </>
    ),
    bank: (
      <>
        <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
        <circle cx="12" cy="12" r="2.6" />
      </>
    ),
    receipt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V9M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
      </>
    ),
    refresh: <path d="M20 11a8 8 0 1 0-2.6 6.5M20 5.5V11h-5.5" />,
    moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
      </>
    ),
    lock: (
      <>
        <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
        <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    left: <path d="M15 5l-7 7 7 7" />,
    right: <path d="M9 5l7 7-7 7" />,
    download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 20h16" />,
    print: (
      <>
        <path d="M7 9V4h10v5" />
        <rect x="4" y="9" width="16" height="7" rx="2" />
        <path d="M7 16h10v4H7z" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name] ?? paths.grid}
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { settings, filters, setFilters, theme, toggleTheme, monthLabel, toasts, dismissToast } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const refresh = useCallback(() => {
    setBusy(true);
    notifyChange("all");
    window.setTimeout(() => setBusy(false), 700);
  }, []);

  useEffect(() => setNavOpen(false), [pathname]);

  const quick = (href: string, action: string) => {
    requestAction(action);
    router.push(href);
  };

  const classes = settings?.classes ?? [];

  return (
    <div className="min-h-screen bg-ink-50 text-ink-900 dark:bg-ink-950 dark:text-ink-100">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm">
        Skip to content
      </a>

      {/* ---------------------------- sidebar (desktop) ---------------------------- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[236px] flex-col border-r border-ink-200 bg-white px-3 py-4 dark:border-ink-800 dark:bg-ink-900 lg:flex">
        <Link href="/" className="mb-4 flex items-center gap-2.5 px-1">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/25">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 5.5c-2-1.6-4.6-2-8-1.8V19c3.4-.2 6 .2 8 1.8 2-1.6 4.6-2 8-1.8V3.7c-3.4-.2-6 .2-8 1.8z" />
              <path d="M12 5.5V21" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-bold leading-tight">{settings?.school.name ?? "Iqra School"}</span>
            <span className="block text-[10.5px] font-medium text-brand-600 dark:text-brand-400">Recorder System</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.hint}
                className={cn(
                  "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-semibold transition-all duration-150",
                  active
                    ? "bg-brand-600 text-white shadow-sm shadow-brand-600/25"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white",
                )}
              >
                <Icon name={item.icon} className={cn("h-4 w-4 shrink-0", active ? "opacity-100" : "opacity-70")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-3 space-y-2 border-t border-ink-200 pt-3 dark:border-ink-800">
          <div className="rounded-xl bg-brand-50 p-2.5 text-[11px] leading-snug text-brand-900 dark:bg-brand-900/30 dark:text-brand-100">
            <p className="font-bold">Quick actions</p>
            <div className="mt-1.5 flex flex-col gap-1">
              <button onClick={() => quick("/fees", "collect")} className="text-left underline-offset-2 hover:underline">＋ Collect Fee</button>
              <button onClick={() => quick("/salaries", "pay")} className="text-left underline-offset-2 hover:underline">＋ Pay Teacher</button>
              <button onClick={() => quick("/expenses", "add")} className="text-left underline-offset-2 hover:underline">＋ Other Expense</button>
            </div>
          </div>
          <p className="px-1 text-[10px] font-medium text-ink-400">
            {settings?.school.createdBy ?? "Created by Mr. AbdulWahid"}
          </p>
        </div>
      </aside>

      {/* ------------------------------- top bar ------------------------------- */}
      <div className="lg:pl-[236px]">
        <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/90 backdrop-blur-md dark:border-ink-800 dark:bg-ink-900/90">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:px-4">
            <button
              className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800 lg:hidden"
              onClick={() => setNavOpen((v) => !v)}
              aria-label="Menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>

            <div className="flex items-center gap-1 rounded-xl border border-ink-200 bg-ink-50 p-0.5 dark:border-ink-700 dark:bg-ink-800/60">
              <button
                onClick={() => setFilters({ month: ymShift(filters.month, -1) })}
                className="rounded-lg p-1.5 text-ink-500 transition hover:bg-white hover:text-brand-700 dark:hover:bg-ink-900"
                title="Previous month"
              >
                <Icon name="left" className="h-3.5 w-3.5" />
              </button>
              <input
                type="month"
                value={filters.month}
                onChange={(e) => setFilters({ month: e.target.value || currentYm() })}
                className="w-[124px] bg-transparent px-1 text-center text-[12.5px] font-bold text-ink-800 outline-none dark:text-ink-50 [color-scheme:light] dark:[color-scheme:dark]"
                title="Choose month — every view updates"
              />
              <button
                onClick={() => setFilters({ month: ymShift(filters.month, 1) })}
                className="rounded-lg p-1.5 text-ink-500 transition hover:bg-white hover:text-brand-700 dark:hover:bg-ink-900"
                title="Next month"
              >
                <Icon name="right" className="h-3.5 w-3.5" />
              </button>
            </div>
            <Badge tone="green" className="hidden sm:inline-flex">{monthLabel}</Badge>

            <div className="hidden items-center gap-1.5 md:flex">
              <SelectInput
                value={filters.className}
                onChange={(e) => setFilters({ className: e.target.value })}
                className="!w-[110px] !py-1.5 text-xs"
                title="Filter by class"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </SelectInput>
              <SelectInput
                value={filters.section}
                onChange={(e) => setFilters({ section: e.target.value })}
                className="!w-[92px] !py-1.5 text-xs"
                title="Filter by section"
              >
                <option value="">All Sections</option>
                {(settings?.sections ?? []).map((s) => (
                  <option key={s} value={s}>Sec {s}</option>
                ))}
              </SelectInput>
            </div>

            <form
              className="order-last w-full sm:order-none sm:ml-auto sm:w-auto"
              onSubmit={(e) => {
                e.preventDefault();
                const value = new FormData(e.currentTarget).get("q");
                setFilters({ q: String(value ?? "").trim() });
                if (!pathname.startsWith("/students") && !pathname.startsWith("/teachers")) router.push("/students");
              }}
            >
              <div className="relative">
                <TextInput
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Search student, teacher, receipt…"
                  className="sm:w-[240px]"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-brand-600 px-2 py-1 text-[11px] font-semibold text-white"
                >
                  Go
                </button>
              </div>
            </form>

            <div className="ml-auto flex items-center gap-1 sm:ml-0">
              <button onClick={refresh} className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 hover:text-brand-700 dark:hover:bg-ink-800" title="Refresh all numbers">
                {busy ? <Spinner className="h-4 w-4" /> : <Icon name="refresh" />}
              </button>
              <button onClick={toggleTheme} className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 hover:text-brand-700 dark:hover:bg-ink-800" title="Dark / light mode">
                <Icon name={theme === "dark" ? "sun" : "moon"} />
              </button>
            </div>
          </div>

          {navOpen ? (
            <nav className="flex gap-1.5 overflow-x-auto border-t border-ink-200 px-3 py-2 dark:border-ink-800 lg:hidden">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold",
                    (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))
                      ? "bg-brand-600 text-white"
                      : "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </header>

        <main id="main" className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-4 sm:py-5">
          {children}
        </main>

        <footer className="border-t border-ink-200 px-4 py-4 text-center text-[11px] text-ink-400 dark:border-ink-800 sm:pb-6">
          {settings?.school.name ?? "Iqra Islamic Education School"} · {settings?.school.tagline ?? "School Student & Teacher Recorder"} —{" "}
          {settings?.school.createdBy ?? "Created by Mr. AbdulWahid"}
        </footer>
      </div>

      <ToastStack toasts={toasts} dismiss={dismissToast} />
    </div>
  );
}

function ToastStack({ toasts, dismiss }: { toasts: { id: number; message: string; kind: string }[]; dismiss: (id: number) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(92vw,340px)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={cn(
            "animate-rise pointer-events-auto cursor-pointer rounded-xl border px-3.5 py-2.5 text-sm font-medium shadow-lg backdrop-blur",
            t.kind === "error"
              ? "border-rose-200 bg-rose-50/95 text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/80 dark:text-rose-200"
              : t.kind === "info"
                ? "border-sky-200 bg-sky-50/95 text-sky-800 dark:border-sky-500/30 dark:bg-sky-950/80 dark:text-sky-200"
                : "border-emerald-200 bg-emerald-50/95 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/80 dark:text-emerald-200",
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export { Icon };

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, CHANGED } from "@/lib/api";
import { currentYm, ymEnd, ymLabel } from "@/lib/utils";

/* --------------------------------- types ---------------------------------- */

export type Settings = {
  school: {
    name: string;
    tagline: string;
    address: string;
    phone: string;
    email: string;
    principal: string;
    createdBy: string;
    currency: string;
    currencySymbol: string;
  };
  feeDefaults: { defaultFee: number; perClass: Record<string, number>; dueDay: number; lateFee: number };
  salaryDefaults: { defaultSalary: number; payDay: number };
  pdf: {
    showCreator: boolean;
    showHeader: boolean;
    showWatermark: boolean;
    showTotals: boolean;
    includeAttachments: boolean;
    footerText: string;
    pageSize: "A4" | "LETTER";
    orientation: "portrait" | "landscape";
  };
  ui: { theme: "light" | "dark"; pageSize: number; highlightDefaults: boolean };
  meta: { openingBalance: number; lastBackupAt: string | null; backupCount: number };
  classes: { name: string; defaultFee: number }[];
  sections: string[];
  subjects: string[];
  expenseCategories: string[];
  paymentMethods: string[];
};

export const SETTINGS_EVENT = "iqra:settings";

export type Filters = {
  month: string;
  from: string;
  to: string;
  useCustomRange: boolean;
  className: string;
  section: string;
  feeStatus: string;
  payStatus: string;
  expenseCategory: string;
  q: string;
};

type Ctx = {
  settings: Settings | null;
  refreshSettings: () => void;
  saveSettings: (patch: Partial<Settings>) => Promise<void>;
  theme: "light" | "dark";
  toggleTheme: () => void;
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  monthLabel: string;
  money: (n: number | null | undefined) => string;
  symbol: string;
  toast: (message: string, kind?: "success" | "error" | "info") => void;
  toasts: { id: number; message: string; kind: string }[];
  dismissToast: (id: number) => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside <Providers>");
  return ctx;
}

const FILTER_KEY = "iqra-filters-v1";
const THEME_KEY = "iqra-theme";

function defaultFilters(): Filters {
  const ym = currentYm();
  return {
    month: ym,
    from: `${ym}-01`,
    to: ymEnd(ym),
    useCustomRange: false,
    className: "",
    section: "",
    feeStatus: "all",
    payStatus: "all",
    expenseCategory: "",
    q: "",
  };
}

export function Providers({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [filters, setFiltersState] = useState<Filters>(() => {
    if (typeof window === "undefined") return defaultFilters();
    try {
      const raw = window.localStorage.getItem(FILTER_KEY);
      if (raw) return { ...defaultFilters(), ...(JSON.parse(raw) as Filters) };
    } catch {
      /* ignore */
    }
    return defaultFilters();
  });
  const [toasts, setToasts] = useState<{ id: number; message: string; kind: string }[]>([]);

  /* theme */
  useEffect(() => {
    const stored = (window.localStorage.getItem(THEME_KEY) as "light" | "dark" | null) ?? null;
    if (stored) setTheme(stored);
    else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) setTheme("dark");
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  /* settings */
  const loadSettings = useCallback(async () => {
    try {
      const res = await api<{ settings: Settings }>("/api/settings", {});
      setSettings(res.settings);
    } catch {
      /* keep previous */
    }
  }, []);
  useEffect(() => {
    void loadSettings();
    const onChanged = () => void loadSettings();
    window.addEventListener(SETTINGS_EVENT, onChanged);
    return () => window.removeEventListener(SETTINGS_EVENT, onChanged);
  }, [loadSettings]);

  const saveSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const res = await api<{ settings: Settings }>("/api/settings", { method: "PUT", json: patch });
      setSettings(res.settings);
      window.dispatchEvent(new Event(SETTINGS_EVENT));
      notifyAll();
    },
    [],
  );

  /* filters */
  const setFilters = useCallback((patch: Partial<Filters>) => {
    setFiltersState((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(FILTER_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(FILTER_KEY, JSON.stringify(filters));
    } catch {
      /* ignore */
    }
  }, [filters]);

  /* toasts */
  const toast = useCallback((message: string, kind: "success" | "error" | "info" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-3), { id, message, kind }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const symbol = settings?.school.currencySymbol ?? "Rs.";
  const money = useCallback(
    (n: number | null | undefined) => {
      const v = Number(n ?? 0);
      const sign = v < 0 ? "-" : "";
      return `${sign}${symbol} ${Math.abs(Math.round(v)).toLocaleString("en-US")}`;
    },
    [symbol],
  );

  const value = useMemo<Ctx>(
    () => ({
      settings,
      refreshSettings: () => void loadSettings(),
      saveSettings,
      theme,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      filters,
      setFilters,
      monthLabel: ymLabel(filters.month),
      money,
      symbol,
      toast,
      toasts,
      dismissToast,
    }),
    [
      settings,
      loadSettings,
      saveSettings,
      theme,
      filters,
      setFilters,
      money,
      symbol,
      toast,
      toasts,
      dismissToast,
    ],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

function notifyAll() {
  window.dispatchEvent(new CustomEvent(CHANGED, { detail: { scope: "all" } }));
}

export function refreshAll() {
  notifyAll();
}

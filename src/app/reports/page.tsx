"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/Providers";
import { api, useJson } from "@/lib/api";
import { DataTable, type Column } from "@/components/DataTable";
import {
  Badge,
  Button,
  Card,
  Field,
  Grid,
  LoadingRows,
  Money,
  SectionTitle,
  SelectInput,
  StatCard,
  Tabs,
  TextInput,
} from "@/components/ui";
import {
  downloadExpenseReport,
  downloadFeeSheetReport,
  downloadMonthlyFinancialReport,
  downloadSalaryReport,
  downloadStudentHistory,
  downloadTransactionsReport,
} from "@/lib/reports";
import type { ExpenseRow, FeeRow, Overview, SalaryRow, StudentProfile, Txn } from "@/lib/viewTypes";
import { dateLabel, pct, ymEnd, ymLabel } from "@/lib/utils";

type Sheets = { fee: FeeRow[]; salary: SalaryRow[]; txns: Txn[]; totals: Record<string, number> };
type Expenses = { expenses: ExpenseRow[]; total: number };

export default function ReportsPage() {
  const { filters, setFilters, settings, money, toast } = useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const [type, setType] = useState("all");
  const [studentId, setStudentId] = useState("");

  const q = useMemo(() => {
    const p = new URLSearchParams();
    p.set("month", filters.month);
    if (filters.useCustomRange && filters.from && filters.to) {
      p.set("from", filters.from);
      p.set("to", filters.to);
    }
    if (filters.className) p.set("className", filters.className);
    if (filters.section) p.set("section", filters.section);
    if (filters.q) p.set("q", filters.q);
    return p.toString();
  }, [filters]);

  const analytics = useJson<{ data: Overview }>(`/api/analytics?${q}`);
  const sheets = useJson<Sheets>(`/api/sheets?${q}`);
  const expQ = `${q}${q.includes("from=") ? "" : `&month=${filters.month}`}`;
  const expenses = useJson<Expenses>(`/api/expenses?${expQ}`);

  const ov = analytics.data?.data ?? null;
  const feeRows = sheets.data?.fee ?? [];
  const salaryRows = sheets.data?.salary ?? [];
  const txns = (sheets.data?.txns ?? []).filter((t) => type === "all" || t.type === type);
  const from = filters.useCustomRange ? filters.from : `${filters.month}-01`;
  const to = filters.useCustomRange ? filters.to : ymEnd(filters.month);

  const run = async (key: string, fn: () => Promise<unknown>, label: string) => {
    setBusy(key);
    try {
      await fn();
      toast(`${label} PDF downloaded`, "success");
    } catch (err) {
      toast((err as Error).message || "Could not create the PDF", "error");
    } finally {
      setBusy(null);
    }
  };

  const REPORTS: { key: string; label: string; hint: string; run: () => Promise<unknown> }[] = [
    { key: "fee", label: "Monthly Fee Report", hint: "Every student, fee, paid, remaining, status", run: () => downloadFeeSheetReport(feeRows, { settings, month: filters.month }) },
    { key: "unpaid", label: "Unpaid Fee List", hint: "Students who still owe money this month", run: () => downloadFeeSheetReport(feeRows.filter((r) => r.status !== "paid"), { settings, month: filters.month, onlyUnpaid: true }) },
    { key: "paid", label: "Paid Fee List", hint: "Students who cleared the month", run: () => downloadFeeSheetReport(feeRows.filter((r) => r.status === "paid"), { settings, month: filters.month, title: "Paid Fee List" }) },
    {
      key: "student",
      label: "Single Student Fee History",
      hint: "Choose a student above → complete month-by-month record",
      run: async () => {
        if (!studentId) throw new Error("Please choose a student first.");
        const profile = await api<StudentProfile>(`/api/students/${studentId}`);
        return downloadStudentHistory(profile, settings);
      },
    },
    { key: "salary", label: "Teacher Salary Report", hint: "Salary, paid, remaining, status per teacher", run: () => downloadSalaryReport(salaryRows, { settings, month: filters.month }) },
    { key: "salaryUnpaid", label: "Salary Unpaid List", hint: "Teachers not fully paid this month", run: () => downloadSalaryReport(salaryRows.filter((r) => r.status !== "paid"), { settings, month: filters.month, title: "Teacher Salary Unpaid List" }) },
    { key: "expense", label: "Other Expense Report", hint: "All spending with category summary", run: () => downloadExpenseReport(expenses.data?.expenses ?? [], { settings, from, to }) },
    { key: "monthly", label: "Monthly Financial Report", hint: "Fees + salaries + expenses + balance + trend", run: () => (ov ? downloadMonthlyFinancialReport(ov, settings) : Promise.reject(new Error("Dashboard data still loading"))) },
    { key: "custom", label: "Custom Date-to-Date Report", hint: "Every transaction between two dates", run: () => downloadTransactionsReport(txns, { settings, from, to, balance: ov?.kpis.currentBalance }) },
    { key: "complete", label: "Complete School Financial Report", hint: "All transactions + totals + balance", run: () => downloadTransactionsReport(sheets.data?.txns ?? [], { settings, from, to, title: "Complete School Financial Report", balance: ov?.kpis.currentBalance }) },
  ];

  const txnColumns: Column<Txn>[] = [
    { key: "date", label: "Date", render: (r) => <span className="whitespace-nowrap text-xs">{dateLabel(r.date)}</span> },
    {
      key: "type",
      label: "Type",
      render: (r) => (
        <Badge tone={r.direction === "in" ? "green" : r.type === "salary" ? "blue" : "amber"}>
          {r.type === "fee" ? "Fee" : r.type === "salary" ? "Salary" : "Expense"}
        </Badge>
      ),
    },
    { key: "person", label: "Student / Teacher / Vendor", render: (r) => <span className="font-semibold">{r.person}</span> },
    { key: "detail", label: "Detail", hideBelow: "md", render: (r) => <span className="text-xs text-ink-500">{r.detail}</span> },
    { key: "docNo", label: "Receipt / Ref", hideBelow: "lg", render: (r) => <span className="font-mono text-[11px]">{r.docNo}</span> },
    { key: "amount", label: "Amount", align: "right", render: (r) => <Money value={r.direction === "in" ? r.amount : -r.amount} className={r.direction === "in" ? "font-bold text-brand-700 dark:text-brand-300" : "font-bold text-rose-600 dark:text-rose-400"} /> },
    { key: "remarks", label: "Remarks", hideBelow: "lg", render: (r) => <span className="text-[11px] text-ink-500">{r.remarks || "—"}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Reports &amp; PDF</h1>
          <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
            Every report is generated live from the database and includes the school letterhead plus “School Student &amp; Teacher Recorder — Created by Mr. AbdulWahid”.
          </p>
        </div>
        <Badge tone="green">{filters.useCustomRange ? `${dateLabel(from)} → ${dateLabel(to)}` : ymLabel(filters.month)}</Badge>
      </div>

      <Card>
        <SectionTitle
          title="1 · Choose the period & segment"
          subtitle="These filters update the preview table and every PDF at the same time."
          right={
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="month"
                value={filters.month}
                onChange={(e) => setFilters({ month: e.target.value, useCustomRange: false })}
                className="input-base !w-[150px] !py-1.5 text-xs [color-scheme:light] dark:[color-scheme:dark]"
              />
              <span className="text-xs text-ink-500">or</span>
              <input type="date" value={from} onChange={(e) => setFilters({ from: e.target.value, useCustomRange: true })} className="input-base !w-[140px] !py-1.5 text-xs [color-scheme:light] dark:[color-scheme:dark]" />
              <span className="text-xs text-ink-500">to</span>
              <input type="date" value={to} onChange={(e) => setFilters({ to: e.target.value, useCustomRange: true })} className="input-base !w-[140px] !py-1.5 text-xs [color-scheme:light] dark:[color-scheme:dark]" />
              <Button size="sm" variant={filters.useCustomRange ? "primary" : "outline"} onClick={() => setFilters({ useCustomRange: !filters.useCustomRange })}>
                {filters.useCustomRange ? "Custom range ON" : "Use month only"}
              </Button>
            </div>
          }
        />
        <div className="grid gap-2 sm:grid-cols-3">
          <Field label="Class segment">
            <SelectInput value={filters.className} onChange={(e) => setFilters({ className: e.target.value })}>
              <option value="">All classes</option>
              {(settings?.classes ?? []).map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Section segment">
            <SelectInput value={filters.section} onChange={(e) => setFilters({ section: e.target.value })}>
              <option value="">All sections</option>
              {(settings?.sections ?? []).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Single student (for student history report)">
            <SelectInput value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Choose student…</option>
              {feeRows.map((r) => (
                <option key={r.id} value={r.id}>{r.name} · {r.className}-{r.section}</option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </Card>

      <Grid cols={4}>
        <StatCard label="Fees Collected" value={money(sheets.data?.totals.feesPaid ?? 0)} hint={`Expected ${money(sheets.data?.totals.feesExpected ?? 0)}`} tone="green" progress={pct(sheets.data?.totals.feesPaid ?? 0, Math.max(1, sheets.data?.totals.feesExpected ?? 1))} />
        <StatCard label="Salaries Paid" value={money(sheets.data?.totals.salaryPaid ?? 0)} hint={`Remaining ${money(sheets.data?.totals.salaryRemaining ?? 0)}`} tone="violet" />
        <StatCard label="Other Expenses" value={money(expenses.data?.total ?? 0)} hint={`${expenses.data?.expenses.length ?? 0} record(s)`} tone="amber" />
        <StatCard label="Current Balance" value={money(ov?.kpis.currentBalance ?? 0)} hint={`Students ${ov?.kpis.totalStudents ?? 0} · Teachers ${ov?.kpis.totalTeachers ?? 0}`} tone="blue" />
      </Grid>

      <div className="grid gap-3 xl:grid-cols-[340px_1fr]">
        <Card>
          <h3 className="mb-1 text-sm font-semibold">2 · Pick a report</h3>
          <p className="mb-3 text-[11px] text-ink-500">PDF opens in your browser’s download list.</p>
          <ul className="space-y-1.5">
            {REPORTS.map((r) => (
              <li key={r.key}>
                <button
                  onClick={() => void run(r.key, r.run, r.label)}
                  disabled={busy !== null}
                  className="group flex w-full items-center gap-2 rounded-xl border border-ink-200 px-2.5 py-2 text-left transition hover:border-brand-400 hover:bg-brand-50/60 disabled:opacity-60 dark:border-ink-800 dark:hover:bg-brand-900/20"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M7 3h8l4 4v14H7z" strokeLinejoin="round" />
                      <path d="M10 12h6M10 16h6" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{r.label}</span>
                    <span className="block truncate text-[11px] text-ink-500">{r.hint}</span>
                  </span>
                  {busy === r.key ? <LoadingRows rows={1} /> : <span className="text-[11px] font-semibold text-brand-700 opacity-0 transition group-hover:opacity-100 dark:text-brand-300">PDF ↓</span>}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">3 · Preview of {txns.length} transaction(s)</h3>
            <Tabs
              value={type}
              onChange={setType}
              items={[
                { value: "all", label: "All" },
                { value: "fee", label: "Fees", count: (sheets.data?.txns ?? []).filter((t) => t.type === "fee").length },
                { value: "salary", label: "Salaries", count: (sheets.data?.txns ?? []).filter((t) => t.type === "salary").length },
                { value: "expense", label: "Expenses", count: (sheets.data?.txns ?? []).filter((t) => t.type === "expense").length },
              ]}
            />
          </div>
          {(analytics.loading || sheets.loading) && !ov ? (
            <LoadingRows rows={8} />
          ) : (
            <DataTable<Txn>
              rows={txns}
              columns={txnColumns}
              rowKey={(r) => `${r.type}-${r.id}`}
              initialSort={{ key: "date", dir: "desc" }}
              pageSize={12}
              searchPrompt="Search name, receipt no, category…"
              empty={{ title: "No transactions in this period", hint: "Try another month or widen the date range." }}
              summary={(rs) => {
                const ins = rs.filter((r) => r.direction === "in").reduce((s, r) => s + r.amount, 0);
                const outs = rs.filter((r) => r.direction === "out").reduce((s, r) => s + r.amount, 0);
                return (
                  <div className="flex flex-wrap items-center gap-3 font-medium">
                    <span>Money IN: {money(ins)}</span>
                    <span>Money OUT: {money(outs)}</span>
                    <span className={ins - outs >= 0 ? "text-emerald-600" : "text-rose-600"}>Net: {money(ins - outs)}</span>
                    <span className="ml-auto text-[11px] text-ink-500">
                      Balance as of {dateLabel(to)}: {money(ov?.kpis.currentBalance ?? 0)}
                    </span>
                  </div>
                );
              }}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

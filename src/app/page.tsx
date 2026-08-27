"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Providers";
import { notifyChange, useJson } from "@/lib/api";
import { downloadMonthlyFinancialReport } from "@/lib/reports";
import { MoneyFlow } from "@/components/MoneyFlow";
import { ReceiptButton } from "@/components/Receipt";
import { DataTable, type Column } from "@/components/DataTable";
import { BalanceAreaChart, ClassBarChart, DonutChart, MoneyTrendChart } from "@/components/Charts";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Grid,
  LoadingRows,
  Money,
  Panel,
  SectionTitle,
  StatCard,
  StatusBadge,
  TextInput,
} from "@/components/ui";
import type { ExpenseRow, Overview, PaymentRow } from "@/lib/viewTypes";
import { cn, currentYm, dateLabel, formatMoney, pct, ymLabel, ymShift } from "@/lib/utils";

export default function DashboardPage() {
  const { filters, setFilters, settings, money, symbol, toast } = useApp();
  const [exporting, setExporting] = useState(false);

  const query = useMemo(() => {
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

  const { data, loading, error, reload } = useJson<{ data: Overview }>(`/api/analytics?${query}`);
  const ov = data?.data ?? null;

  const segmentLabel = [filters.className && `Class ${filters.className}`, filters.section && `Section ${filters.section}`, filters.q && `“${filters.q}”`]
    .filter(Boolean)
    .join(" · ");

  const period = ov?.period;

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Dashboard</h1>
          <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
            {settings?.school.name ?? "Iqra Islamic Education School"} · complete money situation for{" "}
            <strong className="text-ink-700 dark:text-ink-200">
              {period ? (filters.useCustomRange ? `${dateLabel(period.from)} → ${dateLabel(period.to)}` : ymLabel(period.ym)) : ymLabel(filters.month)}
            </strong>
            {segmentLabel ? <span className="ml-1 text-brand-600 dark:text-brand-400">· {segmentLabel}</span> : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-ink-200 bg-white p-1 dark:border-ink-800 dark:bg-ink-900">
            {[
              { label: "This Month", month: currentYm(), custom: false },
              { label: "Last Month", month: ymShift(currentYm(), -1), custom: false },
              { label: "Previous", month: ymShift(filters.month, -1), custom: false },
            ].map((b) => (
              <button
                key={b.label}
                onClick={() => setFilters({ month: b.month, useCustomRange: false })}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition",
                  !filters.useCustomRange && filters.month === b.month
                    ? "bg-brand-600 text-white"
                    : "text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800",
                )}
              >
                {b.label}
              </button>
            ))}
            <button
              onClick={() => setFilters({ useCustomRange: !filters.useCustomRange })}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition",
                filters.useCustomRange ? "bg-brand-600 text-white" : "text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800",
              )}
            >
              Date Range
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => { reload(); notifyChange("all"); }} loading={loading}>
            Refresh
          </Button>
          <Button
            size="sm"
            variant="soft"
            disabled={!ov}
            loading={exporting}
            onClick={async () => {
              if (!ov) return;
              setExporting(true);
              try {
                await downloadMonthlyFinancialReport(ov, settings);
                toast("Monthly financial report PDF downloaded", "success");
              } catch (e) {
                toast((e as Error).message, "error");
              } finally {
                setExporting(false);
              }
            }}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {filters.useCustomRange ? (
        <Card className="!p-3">
          <div className="flex flex-wrap items-end gap-2">
            <Field label="From date" className="w-[150px]">
              <TextInput type="date" value={filters.from} onChange={(e) => setFilters({ from: e.target.value })} />
            </Field>
            <Field label="To date" className="w-[150px]">
              <TextInput type="date" value={filters.to} onChange={(e) => setFilters({ to: e.target.value })} />
            </Field>
            <Button size="sm" onClick={() => setFilters({ month: filters.to ? filters.to.slice(0, 7) : filters.month })}>
              Apply range to every view
            </Button>
            <span className="ml-auto text-[11px] text-ink-500">
              KPI cards follow this range. “Remaining” numbers are calculated up to the To date.
            </span>
          </div>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-rose-200 bg-rose-50 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200">
          Could not load dashboard numbers: {error}
        </Card>
      ) : null}

      {/* KPI cards */}
      {loading && !ov ? (
        <Card>
          <Grid cols={4}>
            {Array.from({ length: 8 }).map((_, i) => (
              <LoadingRows key={i} rows={2} />
            ))}
          </Grid>
        </Card>
      ) : ov ? (
        <>
          <Grid cols={4}>
            <StatCard
              label="Current Balance"
              value={money(ov.kpis.currentBalance)}
              hint={`Opening fund ${money(ov.kpis.openingBalance)} + all fees − all spending`}
              tone="green"
              trend={ov.kpis.trends.balance}
              progress={100}
            />
            <StatCard
              label="Total Fees Collected"
              value={money(ov.kpis.collectedPeriod)}
              hint={`${ov.kpis.feeTxCount} payment${ov.kpis.feeTxCount === 1 ? "" : "s"} this period · all time ${money(ov.kpis.feesCollectedAllTime)}`}
              tone="blue"
              trend={ov.kpis.trends.collected}
              progress={pct(ov.kpis.collectedFees, Math.max(1, ov.kpis.expectedFees))}
            />
            <StatCard
              label="Teacher Salaries Paid"
              value={money(ov.kpis.salariesPeriod)}
              hint={`${ov.kpis.salaryTxCount} salary payment${ov.kpis.salaryTxCount === 1 ? "" : "s"} · all time ${money(ov.kpis.salariesAllTime)}`}
              tone="violet"
              trend={ov.kpis.trends.salaries}
              invertTrend
              progress={pct(ov.kpis.salariesPeriod, Math.max(1, ov.summary.salaryTotal))}
            />
            <StatCard
              label="Other Expenses Paid"
              value={money(ov.kpis.expensesPeriod)}
              hint={`${ov.kpis.expenseTxCount} expense record${ov.kpis.expenseTxCount === 1 ? "" : "s"} · all time ${money(ov.kpis.expensesAllTime)}`}
              tone="amber"
              trend={ov.kpis.trends.expenses}
              invertTrend
            />
            <StatCard
              label="Fees Remaining"
              value={money(ov.kpis.feesRemaining)}
              hint={`Students Due: ${ov.kpis.partialCount + ov.kpis.unpaidCount} of ${ov.kpis.totalStudents}`}
              tone={ov.kpis.feesRemaining > 0 ? "red" : "green"}
              progress={pct(ov.kpis.expectedFees - ov.kpis.collectedFees, Math.max(1, ov.kpis.expectedFees))}
            />
            <StatCard
              label="Salaries Remaining"
              value={money(ov.kpis.salariesRemaining)}
              hint={`Salary Due: ${ov.kpis.totalTeachers - ov.unpaidTeachers.length} of ${ov.kpis.totalTeachers} teachers paid`}
              tone={ov.kpis.salariesRemaining > 0 ? "red" : "green"}
            />
            <StatCard label="Total Students" value={ov.kpis.totalStudents} hint={`Paid ${ov.kpis.paidCount} · Partial ${ov.kpis.partialCount} · Not paid ${ov.kpis.unpaidCount}`} tone="blue" />
            <StatCard label="Total Teachers" value={ov.kpis.totalTeachers} hint={`Monthly salary bill ${money(ov.summary.salaryTotal)}`} tone="slate" />
          </Grid>

          {/* money flow */}
          <Card>
            <SectionTitle
              title="School Money Flow"
              subtitle="Student Fees → School Money → Teacher Salaries / Other Expenses → Current Balance"
              right={<Badge tone="green">No double counting</Badge>}
            />
            <MoneyFlow flow={ov.flow} label={ov.period.label} />
          </Card>

          {/* charts */}
          <div className="grid gap-3 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <SectionTitle
                title="Fees, salaries & expenses by month"
                subtitle="Last 13 months up to the selected month — hover the bars and lines for exact amounts"
                right={
                  <Link href="/reports" className="text-[11px] font-semibold text-brand-700 hover:underline dark:text-brand-300">
                    All reports →
                  </Link>
                }
              />
              <MoneyTrendChart data={ov.series} symbol={symbol} />
            </Card>
            <Panel title="Spending by category" right={<span className="text-[11px] text-ink-400">{ov.period.label}</span>}>
              {ov.categories.length ? (
                <DonutChart
                  data={ov.categories.map((c) => ({ name: c.name, value: c.value }))}
                  centerLabel="Other Expenses"
                  centerValue={formatMoney(ov.categories.reduce((s, c) => s + c.value, 0), symbol)}
                  formatter={(v) => `${money(v)} · ${Math.round((v / Math.max(1, ov.categories.reduce((s, c) => s + c.value, 0))) * 100)}%`}
                />
              ) : (
                <EmptyState title="No expenses in this period" hint="Add one from Other Expenses." />
              )}
            </Panel>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            <Panel title="Collection by class" right={<Badge tone="green">{ov.summary.collectionRate}% collected</Badge>}>
              {ov.classBars.length ? (
                <ClassBarChart data={ov.classBars} symbol={symbol} height={240} />
              ) : (
                <EmptyState title="No students match this filter" />
              )}
            </Panel>
            <Panel title="Fee status this month">
              <DonutChart
                data={ov.statusSplit.map((s) => ({ name: s.name, value: s.value }))}
                colors={ov.statusSplit.map((s) => s.color)}
                centerLabel="Students"
                centerValue={String(ov.kpis.totalStudents)}
                formatter={(v, n) => `${v} ${n.toLowerCase()}`}
                height={200}
              />
            </Panel>
            <Panel title="Balance trend">
              <BalanceAreaChart data={ov.series.map((s) => ({ label: s.label, balance: s.balance }))} symbol={symbol} height={200} />
            </Panel>
          </div>

          {/* dues */}
          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <SectionTitle
                title={`Students who have NOT paid — ${ymLabel(filters.month)}`}
                subtitle={ov.unpaidStudents.length ? "Sorted by highest remaining amount" : undefined}
                right={
                  <Link href="/fees">
                    <Button size="sm" variant="soft">Fee Collection →</Button>
                  </Link>
                }
              />
              {ov.unpaidStudents.length ? (
                <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                  {ov.unpaidStudents.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 py-2">
                      <Avatar name={s.name} photoId={s.photoId} size={32} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/students/${s.id}`} className="block truncate text-sm font-semibold hover:text-brand-700 dark:hover:text-brand-300">
                          {s.name}
                        </Link>
                        <p className="truncate text-[11px] text-ink-500">
                          {s.className}-{s.section} · {s.fatherName} · Fee {money(s.monthlyFee)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{money(s.remaining)}</p>
                        <StatusBadge status={s.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Everyone has paid this month" hint="No pending student fees for this filter." />
              )}
            </Card>

            <Card>
              <SectionTitle
                title={`Teachers whose salary is NOT paid — ${ymLabel(filters.month)}`}
                subtitle={ov.unpaidTeachers.length ? "Please clear these before month end" : undefined}
                right={
                  <Link href="/salaries">
                    <Button size="sm" variant="soft">Teacher Salary →</Button>
                  </Link>
                }
              />
              {ov.unpaidTeachers.length ? (
                <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                  {ov.unpaidTeachers.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 py-2">
                      <Avatar name={t.name} photoId={t.photoId} size={32} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/teachers/${t.id}`} className="block truncate text-sm font-semibold hover:text-brand-700 dark:hover:text-brand-300">
                          {t.name}
                        </Link>
                        <p className="truncate text-[11px] text-ink-500">{t.subject} · Salary {money(t.monthlySalary)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{money(t.remaining)}</p>
                        <StatusBadge status={t.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="All salaries are paid for this month" hint="Nothing pending for the selected month." />
              )}
            </Card>
          </div>

          {/* monthly summary */}
          <Card>
            <SectionTitle title={`Monthly summary — ${ymLabel(filters.month)}`} subtitle="Every number below comes from the live database, not a mock view" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
              {[
                { l: "Total expected fees", v: money(ov.summary.expectedFees) },
                { l: "Fees collected", v: money(ov.summary.collectedFees) },
                { l: "Fees remaining", v: money(ov.summary.feesRemaining) },
                { l: "Students paid", v: String(ov.summary.studentsPaid) },
                { l: "Students partial", v: String(ov.summary.studentsPartial) },
                { l: "Students unpaid", v: String(ov.summary.studentsUnpaid) },
                { l: "Teacher salaries bill", v: money(ov.summary.salaryTotal) },
                { l: "Salaries paid", v: money(ov.summary.salaryPaid) },
                { l: "Salaries remaining", v: money(ov.summary.salariesRemaining) },
                { l: "Other expenses", v: money(ov.summary.expenseTotal) },
                { l: "Collection rate", v: `${ov.summary.collectionRate}%` },
                { l: "Current balance", v: money(ov.summary.balance) },
              ].map((it) => (
                <div key={it.l} className="rounded-lg bg-ink-50 px-2.5 py-2 dark:bg-ink-800/50">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">{it.l}</p>
                  <p className="mt-0.5 font-bold tabular-nums">{it.v}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* recent activity tables */}
          <div className="grid gap-3 xl:grid-cols-2">
            <Card>
              <SectionTitle title="Recent fee payments" subtitle="Latest money received from students" right={<Link href="/fees"><Button size="sm" variant="ghost">Open →</Button></Link>} />
              <DataTable<PaymentRow>
                rows={ov.recentPayments}
                dense
                pageSize={6}
                rowKey={(r) => `p${r.id}`}
                searchPrompt="Search payments…"
                columns={[
                  { key: "paymentDate", label: "Date", render: (r) => <span className="whitespace-nowrap text-xs">{dateLabel(r.paymentDate)}</span> },
                  {
                    key: "studentName",
                    label: "Student",
                    render: (r) => (
                      <div className="min-w-0">
                        <Link href={`/students/${r.studentId}`} className="block truncate font-semibold hover:text-brand-700">{r.studentName}</Link>
                        <span className="text-[11px] text-ink-500">{r.className}-{r.section} · {r.fatherName}</span>
                      </div>
                    ),
                  },
                  { key: "feeMonth", label: "For Month", render: (r) => <span className="text-xs">{ymLabel(String(r.feeMonth))}</span> },
                  { key: "amount", label: "Amount", align: "right", render: (r) => <Money value={r.amount} className="font-bold text-brand-700 dark:text-brand-300" /> },
                  { key: "receiptNo", label: "Receipt", hideBelow: "md", render: (r) => <span className="text-[11px] font-mono">{r.receiptNo}</span> },
                  { key: "id", label: "", align: "right", render: (r) => <ReceiptButton kind="fee" id={r.id} label="View" /> },
                ]}
                empty={{ title: "No fee payments yet", hint: "Use Fee Collection → Collect Fee." }}
              />
            </Card>

            <Card>
              <SectionTitle title="Recent expenses & salary payments" subtitle="Latest money going out of the school" right={<Link href="/expenses"><Button size="sm" variant="ghost">Open →</Button></Link>} />
              <DataTable<ExpenseRow>
                rows={ov.recentExpenses}
                dense
                pageSize={6}
                rowKey={(r) => `e${r.id}`}
                searchPrompt="Search expenses…"
                columns={[
                  { key: "expenseDate", label: "Date", render: (r) => <span className="whitespace-nowrap text-xs">{dateLabel(r.expenseDate)}</span> },
                  {
                    key: "title",
                    label: "Expense",
                    render: (r) => (
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{r.title}</p>
                        <span className="text-[11px] text-ink-500">{r.category} · {r.paidTo || "—"}</span>
                      </div>
                    ),
                  },
                  { key: "amount", label: "Amount", align: "right", render: (r) => <Money value={-r.amount} className="font-bold text-rose-600 dark:text-rose-400" /> },
                  { key: "attachmentId", label: "Proof", align: "center", render: (r) => (r.attachmentId ? <Badge tone="blue">📎</Badge> : <span className="text-ink-300">—</span>) },
                ]}
                empty={{ title: "No expenses recorded" }}
              />
              {ov.recentSalaries.length ? (
                <div className="mt-3 border-t border-ink-100 pt-2 dark:border-ink-800">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Recent salary payments</p>
                  <ul className="space-y-1">
                    {ov.recentSalaries.slice(0, 4).map((s) => (
                      <li key={`s${s.id}`} className="flex items-center justify-between gap-2 text-xs">
                        <Link href={`/teachers/${s.teacherId}`} className="truncate font-semibold hover:text-brand-700">{s.teacherName}</Link>
                        <span className="text-ink-500">{ymLabel(String(s.salaryMonth))}</span>
                        <Money value={s.amount} className="font-bold" />
                        <ReceiptButton kind="salary" id={s.id} label="Slip" />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Card>
          </div>

          {/* quick actions */}
          <Card className="bg-gradient-to-br from-brand-600 to-brand-800 text-white dark:from-brand-700 dark:to-ink-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold">Finish today&apos;s work in a few taps</h3>
                <p className="text-xs text-white/80">Students and teachers are registered once — monthly records continue automatically.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { href: "/fees", label: "＋ Collect Fee", action: "collect" },
                  { href: "/salaries", label: "＋ Pay Teacher", action: "pay" },
                  { href: "/expenses", label: "＋ Other Expense", action: "add" },
                  { href: "/students", label: "＋ New Student", action: "add-student" },
                ].map((a) => (
                  <Link
                    key={a.label}
                    href={a.href}
                    onClick={() => {
                      if (typeof window !== "undefined") window.sessionStorage.setItem("iqra:open-action", a.action);
                    }}
                    className="rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-white/25 backdrop-blur transition hover:bg-white/25"
                  >
                    {a.label}
                  </Link>
                ))}
              </div>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

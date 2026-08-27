"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Providers";
import { api, notifyChange, useJson } from "@/lib/api";
import { takeAction } from "@/lib/nav";
import { downloadSalaryReport } from "@/lib/reports";
import { DataTable, type Column } from "@/components/DataTable";
import { PictureInput, type PictureValue } from "@/components/PictureInput";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  Grid,
  LoadingRows,
  Modal,
  Money,
  ProgressBar,
  SearchBox,
  SelectInput,
  StatusBadge,
  Tabs,
  TextArea,
  TextInput,
} from "@/components/ui";
import type { SalaryRow } from "@/lib/viewTypes";
import { cn, currentYm, dateLabel, ymLabel } from "@/lib/utils";

type Sheets = {
  period: { ym: string };
  salary: SalaryRow[];
  totals: { salaryExpected: number; salaryPaid: number; salaryRemaining: number };
};

export default function TeacherSalaryPage() {
  const { filters, setFilters, settings, money, toast } = useApp();
  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("month", filters.month);
    if (filters.q) p.set("q", filters.q);
    if (filters.payStatus && filters.payStatus !== "all") p.set("payStatus", filters.payStatus);
    return p.toString();
  }, [filters]);

  const { data, loading, reload } = useJson<Sheets>(`/api/sheets?${query}`);
  const rows = data?.salary ?? [];
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<SalaryRow | null>(null);

  const start = useCallback((row?: SalaryRow) => {
    setTarget(row ?? null);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (takeAction() === "pay") start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paid = rows.filter((r) => r.status === "paid").length;
  const partial = rows.filter((r) => r.status === "partial").length;
  const notPaid = rows.filter((r) => r.status === "unpaid").length;

  const columns: Column<SalaryRow>[] = [
    {
      key: "name",
      label: "Teacher",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.name} photoId={r.photoId} size={32} />
          <div className="min-w-0">
            <Link href={`/teachers/${r.id}`} className="block truncate font-semibold hover:text-brand-700 dark:hover:text-brand-300">
              {r.name}
            </Link>
            <span className="text-[11px] text-ink-500">{r.teacherCode}</span>
          </div>
        </div>
      ),
    },
    { key: "subject", label: "Subject", render: (r) => <Badge tone="slate">{r.subject}</Badge> },
    { key: "monthlySalary", label: "Monthly Salary", align: "right", render: (r) => <Money value={r.monthlySalary} /> },
    {
      key: "prevDue",
      label: "Previous Remaining",
      align: "right",
      hideBelow: "md",
      render: (r) => (r.prevDue > 0 ? <Money value={r.prevDue} className="text-amber-600 dark:text-amber-400" /> : <span className="text-ink-400">—</span>),
    },
    { key: "expected", label: "To Pay Now", align: "right", render: (r) => <Money value={r.expected} className="font-semibold" /> },
    { key: "paid", label: "Paid This Month", align: "right", render: (r) => <Money value={r.paid} className="text-brand-700 dark:text-brand-300" /> },
    {
      key: "remaining",
      label: "Remaining",
      align: "right",
      render: (r) => (r.remaining > 0 ? <Money value={r.remaining} className="font-bold text-rose-600 dark:text-rose-400" /> : <span className="font-semibold text-emerald-600">0</span>),
    },
    { key: "status", label: "Status", align: "center", render: (r) => <StatusBadge status={r.status} /> },
    { key: "lastPaymentDate", label: "Paid On", align: "center", hideBelow: "lg", render: (r) => <span className="text-xs">{r.lastPaymentDate ? dateLabel(r.lastPaymentDate) : "—"}</span> },
    {
      key: "actions",
      label: "Action",
      align: "right",
      sortValue: () => 0,
      render: (r) => (r.remaining > 0 ? <Button size="sm" onClick={(e) => { e.stopPropagation(); start(r); }}>Pay</Button> : <Badge tone="green">Done</Badge>),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Teacher Salary — {ymLabel(filters.month)}</h1>
          <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
            The same teacher record is used every month. Salary due appears automatically; nothing is duplicated.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void downloadSalaryReport(rows, { settings, month: filters.month }).then(() => toast("Salary report PDF downloaded"))}>
            Salary Report PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void downloadSalaryReport(rows.filter((r) => r.status !== "paid"), { settings, month: filters.month, title: "Salary Unpaid List" }).then(() => toast("Unpaid list PDF downloaded"))}
          >
            Unpaid List PDF
          </Button>
          <Button size="sm" onClick={() => start()}>＋ Pay Teacher</Button>
        </div>
      </div>

      <Grid cols={4}>
        <Card className="!p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Salary Bill This Month</p>
          <p className="mt-1 text-lg font-extrabold tabular-nums">{money(data?.totals.salaryExpected ?? 0)}</p>
          <p className="text-[11px] text-ink-500">{rows.length} teachers</p>
        </Card>
        <Card className="!p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Paid</p>
          <p className="mt-1 text-lg font-extrabold tabular-nums text-brand-700 dark:text-brand-300">{money(data?.totals.salaryPaid ?? 0)}</p>
          <ProgressBar value={((data?.totals.salaryPaid ?? 0) / Math.max(1, data?.totals.salaryExpected ?? 1)) * 100} />
        </Card>
        <Card className="!p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Salaries Remaining</p>
          <p className="mt-1 text-lg font-extrabold tabular-nums text-rose-600 dark:text-rose-400">{money(data?.totals.salaryRemaining ?? 0)}</p>
          <p className="text-[11px] text-ink-500">Deducted from balance only when paid</p>
        </Card>
        <Card className="!p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Status</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone="green">Paid {paid}</Badge>
            <Badge tone="amber">Partial {partial}</Badge>
            <Badge tone="red">Not Paid {notPaid}</Badge>
          </div>
        </Card>
      </Grid>

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Tabs
            value={filters.payStatus || "all"}
            onChange={(v) => setFilters({ payStatus: v })}
            items={[
              { value: "all", label: "All", count: rows.length },
              { value: "paid", label: "Paid", count: paid },
              { value: "partial", label: "Partial", count: partial },
              { value: "unpaid", label: "Not Paid", count: notPaid },
            ]}
          />
          <SelectInput value={filters.month} onChange={(e) => setFilters({ month: e.target.value || currentYm() })} className="!w-[150px] !py-1.5 text-xs">
            {Array.from({ length: 18 }).map((_, i) => {
              const value = shiftMonth(currentYm(), 6 - i);
              return <option key={value} value={value}>{ymLabel(value)}</option>;
            })}
          </SelectInput>
          <Link href="/teachers" className="ml-auto text-[11px] font-semibold text-brand-700 hover:underline dark:text-brand-300">
            Manage teachers →
          </Link>
        </div>
        {loading && !data ? (
          <LoadingRows rows={5} />
        ) : (
          <DataTable<SalaryRow>
            rows={rows}
            columns={columns}
            rowKey={(r) => r.id}
            initialSort={{ key: "remaining", dir: "desc" }}
            pageSize={10}
            onRowClick={(r) => start(r)}
            searchPrompt="Search teacher, subject, ID…"
            empty={{ title: "No teachers in this view", hint: "Add a teacher from the Teachers page first." }}
            summary={(rs) => (
              <div className="flex flex-wrap items-center gap-3 font-medium">
                <span>Monthly salary total: {money(rs.reduce((s, r) => s + r.monthlySalary, 0))}</span>
                <span>Paid: {money(rs.reduce((s, r) => s + r.paid, 0))}</span>
                <span className="text-rose-600 dark:text-rose-400">Remaining: {money(rs.reduce((s, r) => s + r.remaining, 0))}</span>
              </div>
            )}
          />
        )}
      </Card>

      <PaySalaryModal
        open={open}
        rows={rows}
        initial={target}
        month={filters.month}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          reload();
          notifyChange("students");
        }}
      />
    </div>
  );
}

function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

function PaySalaryModal({
  open,
  rows,
  initial,
  month,
  onClose,
  onSaved,
}: {
  open: boolean;
  rows: SalaryRow[];
  initial: SalaryRow | null;
  month: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { settings, money, toast } = useApp();
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("Cash");
  const [remarks, setRemarks] = useState("");
  const [picture, setPicture] = useState<PictureValue>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<{ referenceNo: string; remaining: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    setTeacherId(initial?.id ?? null);
    setAmount(initial ? String(initial.remaining || initial.monthlySalary) : "");
    setRemarks("");
    setPicture(null);
    setSaved(null);
    setSearch("");
    setMethod("Cash");
    setDate(new Date().toISOString().slice(0, 10));
  }, [open, initial]);

  const candidates = useMemo(() => {
    const list = rows.filter((r) => r.recordStatus === "active");
    if (!search.trim()) return list.slice(0, 30);
    const q = search.toLowerCase();
    return list.filter((r) => `${r.name} ${r.subject} ${r.teacherCode}`.toLowerCase().includes(q)).slice(0, 30);
  }, [rows, search]);

  const teacher = rows.find((r) => r.id === teacherId) ?? null;
  const paidNumber = Number(amount.replace(/[^0-9]/g, "")) || 0;
  const remainingCalc = teacher ? Math.max(0, teacher.expected - paidNumber) : 0;

  const save = async () => {
    if (!teacher) return toast("Please select a teacher.", "error");
    if (paidNumber <= 0) return toast("Enter the salary amount being paid.", "error");
    setBusy(true);
    try {
      const res = await api<{ message: string; payment: { referenceNo: string }; sheetRow: SalaryRow | null }>(
        "/api/salary-payments",
        {
          method: "POST",
          json: {
            teacherId: teacher.id,
            salaryMonth: month,
            amount: paidNumber,
            paymentDate: date,
            method,
            remarks,
            attachmentBase64: picture?.base64,
            attachmentName: picture?.fileName,
            attachmentType: picture?.contentType,
          },
        },
      );
      setSaved({ referenceNo: res.payment.referenceNo, remaining: res.sheetRow?.remaining ?? remainingCalc });
      toast(res.message || "Salary paid", "success");
      onSaved();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pay Teacher Salary"
      subtitle={`${ymLabel(month)} · partial salary is allowed`}
      footer={
        saved ? (
          <Button onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => void save()} loading={busy} disabled={!teacher || paidNumber <= 0}>Save Salary Payment</Button>
          </>
        )
      }
    >
      {saved ? (
        <div className="space-y-2 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-700 dark:bg-emerald-500/15">✓</div>
          <p className="text-sm font-bold">Salary paid — reference {saved.referenceNo}</p>
          <p className="text-xs text-ink-500">Amount deducted from the school balance. Remaining salary: {money(saved.remaining)}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <Field label="1 · Select teacher" required>
            <SearchBox value={search} onChange={setSearch} placeholder="Search teacher name, subject or Teacher ID…" />
          </Field>
          {!teacher ? (
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-ink-200 p-1 dark:border-ink-800">
              {candidates.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setTeacherId(r.id);
                    setAmount(String(r.remaining || r.monthlySalary));
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-brand-50 dark:hover:bg-brand-900/30"
                >
                  <Avatar name={r.name} photoId={r.photoId} size={26} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{r.name}</span>
                    <span className="text-[11px] text-ink-500">{r.subject}</span>
                  </span>
                  <span className={cn("text-xs font-bold", r.remaining > 0 ? "text-rose-600" : "text-emerald-600")}>{r.remaining > 0 ? money(r.remaining) : "Paid"}</span>
                </button>
              ))}
              {!candidates.length ? <p className="p-3 text-center text-xs text-ink-500">No active teacher found.</p> : null}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-ink-50 p-3 dark:bg-ink-800/50 sm:col-span-2">
                <div className="flex items-center gap-3">
                  <Avatar name={teacher.name} photoId={teacher.photoId} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{teacher.name}</p>
                    <p className="text-[11px] text-ink-500">{teacher.subject} · {teacher.teacherCode} · {teacher.contact}</p>
                  </div>
                </div>
              </div>
              <Card className="!p-2.5 dark:bg-ink-900"><p className="text-[10.5px] uppercase text-ink-500">Monthly salary</p><p className="text-sm font-bold tabular-nums">{money(teacher.monthlySalary)}</p></Card>
              <Card className="!p-2.5 dark:bg-ink-900"><p className="text-[10.5px] uppercase text-ink-500">Previous remaining</p><p className="text-sm font-bold tabular-nums">{money(teacher.prevDue)}</p></Card>
              <Field label="2 · Amount paying now" required>
                <TextInput inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} />
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Button size="sm" variant="soft" type="button" onClick={() => setAmount(String(teacher.expected))}>Full {money(teacher.expected)}</Button>
                  <Button size="sm" variant="outline" type="button" onClick={() => setAmount(String(teacher.monthlySalary))}>This month only</Button>
                </div>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="3 · Payment date">
                  <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </Field>
                <Field label="4 · Method">
                  <SelectInput value={method} onChange={(e) => setMethod(e.target.value)}>
                    {(settings?.paymentMethods ?? ["Cash"]).map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </SelectInput>
                </Field>
              </div>
              <Field label="5 · Remarks">
                <TextArea value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <PictureInput onChange={setPicture} label="6 · Payment proof picture (optional)" />
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center dark:border-rose-500/25 dark:bg-rose-950/30 sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">Remaining salary after this payment</p>
                <p className="text-xl font-extrabold tabular-nums text-rose-700 dark:text-rose-300">{money(remainingCalc)}</p>
                <p className="text-[11px] text-ink-500">Reference number is created automatically when you save.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

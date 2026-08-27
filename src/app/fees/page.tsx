"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Providers";
import { api, notifyChange, useJson } from "@/lib/api";
import { takeAction } from "@/lib/nav";
import { downloadFeeSheetReport } from "@/lib/reports";
import { DataTable, type Column } from "@/components/DataTable";
import { PictureInput, type PictureValue } from "@/components/PictureInput";
import { ReceiptButton } from "@/components/Receipt";
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
import type { FeeRow } from "@/lib/viewTypes";
import { cn, currentYm, dateLabel, formatMoney, ymLabel } from "@/lib/utils";

type Sheets = { period: { ym: string }; fee: FeeRow[]; totals: { feesExpected: number; feesPaid: number; feesRemaining: number } };

export default function FeeCollectionPage() {
  const { filters, setFilters, settings, money, toast } = useApp();
  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("month", filters.month);
    if (filters.className) p.set("className", filters.className);
    if (filters.section) p.set("section", filters.section);
    if (filters.q) p.set("q", filters.q);
    if (filters.feeStatus && filters.feeStatus !== "all") p.set("feeStatus", filters.feeStatus);
    return p.toString();
  }, [filters]);

  const { data, loading, reload } = useJson<Sheets>(`/api/sheets?${query}`);
  const rows = data?.fee ?? [];
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<FeeRow | null>(null);

  const start = useCallback((row?: FeeRow) => {
    setTarget(row ?? null);
    setOpen(true);
  }, []);

  useEffect(() => {
    const action = takeAction();
    if (action === "collect") start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paidCount = rows.filter((r) => r.status === "paid").length;
  const partialCount = rows.filter((r) => r.status === "partial").length;
  const unpaidCount = rows.filter((r) => r.status === "unpaid").length;

  const columns: Column<FeeRow>[] = [
    {
      key: "name",
      label: "Student",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.name} photoId={r.photoId} size={32} />
          <div className="min-w-0">
            <Link href={`/students/profile?id=${r.id}`} className="block truncate font-semibold hover:text-brand-700 dark:hover:text-brand-300">
              {r.name}
            </Link>
            <span className="text-[11px] text-ink-500">{r.studentCode} · {r.admissionNo}</span>
          </div>
        </div>
      ),
    },
    { key: "fatherName", label: "Father / Guardian", hideBelow: "md" },
    { key: "className", label: "Class", align: "center", render: (r) => <Badge tone="slate">{r.className}-{r.section}</Badge> },
    { key: "monthlyFee", label: "Monthly Fee", align: "right", render: (r) => <Money value={r.monthlyFee} /> },
    { key: "prevDue", label: "Previous Due", align: "right", hideBelow: "lg", render: (r) => (r.prevDue > 0 ? <Money value={r.prevDue} className="text-amber-600 dark:text-amber-400" /> : <span className="text-ink-400">—</span>) },
    { key: "expected", label: "Total Due", align: "right", render: (r) => <Money value={r.expected} className="font-semibold" /> },
    { key: "paid", label: "Paid This Month", align: "right", render: (r) => <Money value={r.paid} className="text-brand-700 dark:text-brand-300" /> },
    { key: "remaining", label: "Remaining", align: "right", render: (r) => (r.remaining > 0 ? <Money value={r.remaining} className="font-bold text-rose-600 dark:text-rose-400" /> : <span className="font-semibold text-emerald-600">0</span>) },
    { key: "status", label: "Status", align: "center", render: (r) => <StatusBadge status={r.status} /> },
    { key: "lastPaymentDate", label: "Last Payment", align: "center", hideBelow: "lg", render: (r) => <span className="text-xs">{r.lastPaymentDate ? dateLabel(r.lastPaymentDate) : "—"}</span> },
    {
      key: "actions",
      label: "Action",
      align: "right",
      sortValue: () => 0,
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          {r.remaining > 0 ? (
            <Button size="sm" onClick={(e) => { e.stopPropagation(); start(r); }}>Collect</Button>
          ) : (
            <Badge tone="green">Done</Badge>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Fee Collection — {ymLabel(filters.month)}</h1>
          <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
            Every registered student appears here automatically each month. No duplicate student records are created.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void downloadFeeSheetReport(rows, { settings, month: filters.month }).then(() => toast("Fee report PDF downloaded"))}>
            Fee Report PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => void downloadFeeSheetReport(rows.filter((r) => r.status !== "paid"), { settings, month: filters.month, onlyUnpaid: true, title: "Fee Pending List" }).then(() => toast("Pending list PDF downloaded"))}>
            Unpaid List PDF
          </Button>
          <Button size="sm" onClick={() => start()} icon={<PlusIcon />}>Collect Fee</Button>
        </div>
      </div>

      <Grid cols={4}>
        <Card className="!p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Fee Expected</p>
          <p className="mt-1 text-lg font-extrabold tabular-nums">{money(data?.totals.feesExpected ?? 0)}</p>
          <p className="text-[11px] text-ink-500">{rows.length} students in view</p>
        </Card>
        <Card className="!p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Collected This Month</p>
          <p className="mt-1 text-lg font-extrabold tabular-nums text-brand-700 dark:text-brand-300">{money(data?.totals.feesPaid ?? 0)}</p>
          <ProgressBar value={((data?.totals.feesPaid ?? 0) / Math.max(1, data?.totals.feesExpected ?? 1)) * 100} />
        </Card>
        <Card className="!p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Still Remaining</p>
          <p className="mt-1 text-lg font-extrabold tabular-nums text-rose-600 dark:text-rose-400">{money(data?.totals.feesRemaining ?? 0)}</p>
          <p className="text-[11px] text-ink-500">Includes old dues carried forward</p>
        </Card>
        <Card className="!p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Students Due This Month</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone="green">Paid {paidCount}</Badge>
            <Badge tone="amber">Partial {partialCount}</Badge>
            <Badge tone="red">Not Paid {unpaidCount}</Badge>
          </div>
        </Card>
      </Grid>

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Tabs
            value={filters.feeStatus || "all"}
            onChange={(v) => setFilters({ feeStatus: v })}
            items={[
              { value: "all", label: "All", count: rows.length },
              { value: "paid", label: "Paid", count: paidCount },
              { value: "partial", label: "Partial", count: partialCount },
              { value: "unpaid", label: "Not Paid", count: unpaidCount },
            ]}
          />
          <SelectInput value={filters.month} onChange={(e) => setFilters({ month: e.target.value || currentYm() })} className="!w-[150px] !py-1.5 text-xs">
            {Array.from({ length: 24 }).map((_, i) => {
              const ym = ymLabel(currentYm()) ? `${Number(currentYm().slice(0, 4)) - (i > 11 ? 1 : 0)}${""}` : "";
              void ym;
              const value = shiftMonth(currentYm(), 6 - i);
              return <option key={value} value={value}>{ymLabel(value)}</option>;
            })}
          </SelectInput>
          <span className="ml-auto text-[11px] text-ink-500">Class / section filters are in the top bar and update this table live.</span>
        </div>
        {loading && !data ? (
          <LoadingRows rows={8} />
        ) : (
          <DataTable<FeeRow>
            rows={rows}
            columns={columns}
            rowKey={(r) => r.id}
            initialSort={{ key: "remaining", dir: "desc" }}
            pageSize={settings?.ui?.pageSize ?? 10}
            onRowClick={(r) => start(r)}
            searchPrompt="Search name, father, class, student ID…"
            empty={{
              title: "No students in this view",
              hint: "Change the month / class filter, or register a student first.",
              action: (
                <Link href="/students">
                  <Button size="sm">Go to Students</Button>
                </Link>
              ),
            }}
            summary={(rs) => (
              <div className="flex flex-wrap items-center gap-3 font-medium">
                <span>Shown total fee: {money(rs.reduce((s, r) => s + r.monthlyFee, 0))}</span>
                <span>Collected: {money(rs.reduce((s, r) => s + r.paid, 0))}</span>
                <span className="text-rose-600 dark:text-rose-400">Remaining: {money(rs.reduce((s, r) => s + r.remaining, 0))}</span>
              </div>
            )}
          />
        )}
      </Card>

      <CollectFeeModal
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

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------- collect modal ------------------------------ */

export function CollectFeeModal({
  open,
  rows,
  initial,
  month,
  onClose,
  onSaved,
}: {
  open: boolean;
  rows: FeeRow[];
  initial: FeeRow | null;
  month: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { settings, money, toast } = useApp();
  const [studentId, setStudentId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(currentYm() === month ? new Date().toISOString().slice(0, 10) : `${month}-10`);
  const [method, setMethod] = useState("Cash");
  const [remarks, setRemarks] = useState("");
  const [picture, setPicture] = useState<PictureValue>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<{ receiptNo: string; remaining: number; amount: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    setStudentId(initial?.id ?? null);
    setAmount(initial ? String(initial.remaining || initial.monthlyFee) : "");
    setRemarks("");
    setPicture(null);
    setSaved(null);
    setSearch("");
    setMethod("Cash");
    setDate(new Date().toISOString().slice(0, 10));
  }, [open, initial]);

  const candidates = useMemo(() => {
    const list = rows.filter((r) => r.recordStatus === "active");
    if (!search.trim()) return list.slice(0, 40);
    const q = search.toLowerCase();
    return list.filter((r) => `${r.name} ${r.fatherName} ${r.studentCode} ${r.admissionNo} ${r.className}`.toLowerCase().includes(q)).slice(0, 40);
  }, [rows, search]);

  const student = rows.find((r) => r.id === studentId) ?? null;
  const paidNumber = Number(amount.replace(/[^0-9.]/g, "")) || 0;
  const remainingCalc = student ? Math.max(0, student.expected - paidNumber) : 0;

  const save = async () => {
    if (!student) {
      toast("Please select a student first.", "error");
      return;
    }
    if (paidNumber <= 0) {
      toast("Enter the amount the student is paying.", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ message: string; payment: { receiptNo: string }; sheetRow: FeeRow | null }>(
        "/api/fee-payments",
        {
          method: "POST",
          json: {
            studentId: student.id,
            feeMonth: month,
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
      setSaved({ receiptNo: res.payment.receiptNo, remaining: res.sheetRow?.remaining ?? remainingCalc, amount: paidNumber });
      toast(res.message || "Fee saved", "success");
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
      title="Collect Student Fee"
      subtitle={`${ymLabel(month)} · partial payments are allowed`}
      footer={
        saved ? (
          <Button onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => void save()} loading={busy} disabled={!student || paidNumber <= 0}>Save Payment</Button>
          </>
        )
      }
    >
      {saved ? (
        <div className="space-y-3 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-700 dark:bg-emerald-500/15">✓</div>
          <p className="text-sm font-bold">Payment saved — receipt {saved.receiptNo}</p>
          <p className="text-xs text-ink-500">
            {formatMoney(saved.amount, settings?.school.currencySymbol)} added to the school current balance. Remaining fee:{" "}
            {formatMoney(saved.remaining, settings?.school.currencySymbol)}
          </p>
          <div className="flex justify-center gap-2">
            <Badge tone="green">Balance updated</Badge>
            <Badge tone="blue">History saved</Badge>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Field label="1 · Select student" required>
            <SearchBox value={search} onChange={setSearch} placeholder="Type student name, father name or admission no…" />
          </Field>
          {!student ? (
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-ink-200 p-1 dark:border-ink-800">
              {candidates.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setStudentId(r.id);
                    setAmount(String(r.remaining || r.monthlyFee));
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-brand-50 dark:hover:bg-brand-900/30"
                >
                  <Avatar name={r.name} photoId={r.photoId} size={26} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{r.name}</span>
                    <span className="block text-[11px] text-ink-500">{r.className}-{r.section} · {r.fatherName}</span>
                  </span>
                  <span className={cn("shrink-0 text-xs font-bold", r.remaining > 0 ? "text-rose-600" : "text-emerald-600")}>
                    {r.remaining > 0 ? money(r.remaining) : "Paid"}
                  </span>
                </button>
              ))}
              {!candidates.length ? <p className="p-3 text-center text-xs text-ink-500">No active student matches this search.</p> : null}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-ink-50 p-3 dark:bg-ink-800/50 sm:col-span-2">
                <div className="flex items-center gap-3">
                  <Avatar name={student.name} photoId={student.photoId} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{student.name}</p>
                    <p className="text-[11px] text-ink-500">
                      {student.studentCode} · Admission {student.admissionNo} · Class {student.className}-{student.section} · {student.contact}
                    </p>
                  </div>
                  <span className="ml-auto text-right">
                    <span className="block text-[10px] font-semibold uppercase text-ink-500">Total paid so far</span>
                    <span className="block text-sm font-bold tabular-nums">{money(student.totalPaid)}</span>
                  </span>
                </div>
              </div>

              <Info label="Monthly fee" value={money(student.monthlyFee)} />
              <Info label="Previous remaining fee" value={money(student.prevDue)} tone={student.prevDue > 0 ? "amber" : "muted"} />
              <Info label="Current month" value={ymLabel(month)} />
              <Info label="Total to pay now" value={money(student.expected)} tone="brand" />

              <Field label="2 · Amount paying now" required hint="Remaining Fee = Monthly Fee + Previous Due − Amount Paid">
                <TextInput
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 1000"
                />
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Button size="sm" variant="soft" type="button" onClick={() => setAmount(String(student.expected))}>Full {money(student.expected)}</Button>
                  <Button size="sm" variant="outline" type="button" onClick={() => setAmount(String(student.monthlyFee))}>This month only</Button>
                  <Button size="sm" variant="outline" type="button" onClick={() => setAmount(String(Math.round(student.expected / 2)))}>Half</Button>
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

              <Field label="5 · Remarks (optional)" className="sm:col-span-2">
                <TextArea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Paid by elder brother, some discount promised…" />
              </Field>

              <div className="sm:col-span-2">
                <PictureInput existingId={null} onChange={setPicture} label="6 · Receipt picture (optional)" />
              </div>

              <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-center dark:border-brand-800 dark:bg-brand-900/25 sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">Remaining after this payment</p>
                <p className="text-xl font-extrabold tabular-nums text-brand-800 dark:text-brand-200">{money(remainingCalc)}</p>
                {paidNumber > student.expected ? (
                  <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                    Extra {money(paidNumber - student.expected)} will be adjusted next month (advance).
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Info({ label, value, tone = "muted" }: { label: string; value: string; tone?: "muted" | "amber" | "brand" }) {
  return (
    <div className="rounded-lg border border-ink-200 px-2.5 py-2 dark:border-ink-800">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-sm font-bold tabular-nums",
          tone === "amber" && "text-amber-600 dark:text-amber-400",
          tone === "brand" && "text-brand-700 dark:text-brand-300",
        )}
      >
        {value}
      </p>
    </div>
  );
}

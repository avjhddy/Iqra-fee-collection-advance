"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/Providers";
import { api, notifyChange, useJson } from "@/lib/api";
import { takeAction } from "@/lib/nav";
import { downloadExpenseReport } from "@/lib/reports";
import { DataTable, type Column } from "@/components/DataTable";
import { DonutChart } from "@/components/Charts";
import { PictureInput, type PictureValue } from "@/components/PictureInput";
import {
  Badge,
  Button,
  Card,
  Field,
  Grid,
  LoadingRows,
  Modal,
  Money,
  SelectInput,
  StatCard,
  TextArea,
  TextInput,
} from "@/components/ui";
import type { ExpenseRow } from "@/lib/viewTypes";
import { dateLabel, formatMoney, todayYmd, ymEnd } from "@/lib/utils";

type ExpenseResponse = {
  expenses: ExpenseRow[];
  total: number;
  count: number;
  byCategory: { name: string; value: number }[];
};

export default function ExpensesPage() {
  const { filters, setFilters, settings, money, toast } = useApp();
  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("month", filters.month);
    if (filters.useCustomRange && filters.from && filters.to) {
      p.set("from", filters.from);
      p.set("to", filters.to);
    }
    if (filters.q) p.set("q", filters.q);
    if (filters.expenseCategory) p.set("category", filters.expenseCategory);
    return p.toString();
  }, [filters]);

  const { data, loading, reload } = useJson<ExpenseResponse>(`/api/expenses?${query}`);
  const rows = data?.expenses ?? [];
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseRow | null>(null);

  useEffect(() => {
    if (takeAction() === "add") setOpen(true);
  }, []);

  const categories = settings?.expenseCategories ?? ["Electricity", "Water", "Stationery", "Other"];
  const total = data?.total ?? 0;
  const biggest = data?.byCategory?.[0];

  const columns: Column<ExpenseRow>[] = [
    { key: "expenseDate", label: "Date", render: (r) => <span className="whitespace-nowrap text-xs font-medium">{dateLabel(r.expenseDate)}</span> },
    { key: "category", label: "Category", render: (r) => <Badge tone="violet">{r.category}</Badge> },
    {
      key: "title",
      label: "Description",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold">{r.title}</p>
          {r.remarks ? <p className="truncate text-[11px] text-ink-500">{r.remarks}</p> : null}
        </div>
      ),
    },
    { key: "paidTo", label: "Paid To", hideBelow: "md", render: (r) => <span className="text-xs">{r.paidTo || "—"}</span> },
    { key: "method", label: "Method", align: "center", hideBelow: "lg", render: (r) => <span className="text-xs text-ink-500">{r.method}</span> },
    { key: "amount", label: "Amount", align: "right", render: (r) => <Money value={r.amount} className="font-bold text-rose-600 dark:text-rose-400" /> },
    {
      key: "attachmentId",
      label: "Proof",
      align: "center",
      render: (r) =>
        r.attachmentId ? (
          <a href={`/api/attachments/${r.attachmentId}`} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-sky-700 hover:underline dark:text-sky-300">
            📎 View
          </a>
        ) : (
          <span className="text-ink-300">—</span>
        ),
    },
    {
      key: "actions",
      label: "",
      align: "right",
      sortValue: () => 0,
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setEditing(r);
              setOpen(true);
            }}
            className="rounded-lg px-1.5 py-1 text-[11px] font-semibold text-ink-500 hover:bg-ink-100 hover:text-ink-800 dark:hover:bg-ink-800"
          >
            Edit
          </button>
          <VoidExpense id={r.id} onDone={() => { reload(); notifyChange("all"); }} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Other School Expenses</h1>
          <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
            Money spent on everything except teacher salaries. Every record immediately reduces the school current balance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void downloadExpenseReport(rows, { settings, from: filters.useCustomRange ? filters.from : `${filters.month}-01`, to: filters.useCustomRange ? filters.to : ymEnd(filters.month) }).then(() => toast("Expense report PDF downloaded"))}>
            Expense Report PDF
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>＋ Other Expense</Button>
        </div>
      </div>

      <Grid cols={4}>
        <StatCard label="Expenses in this period" value={money(total)} hint={`${data?.count ?? 0} records`} tone="amber" />
        <StatCard label="Biggest category" value={biggest ? biggest.name : "—"} hint={biggest ? money(biggest.value) : "No spending yet"} tone="violet" />
        <StatCard label="Average per record" value={money(data?.count ? Math.round(total / data.count) : 0)} hint="Helps you spot unusual bills" tone="blue" />
        <StatCard
          label="Categories used"
          value={data?.byCategory?.length ?? 0}
          hint={`Out of ${categories.length} available`}
          tone="green"
        />
      </Grid>

      <div className="grid gap-3 xl:grid-cols-[1fr_340px]">
        <Card>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SelectInput
              value={filters.expenseCategory ?? ""}
              onChange={(e) => setFilters({ expenseCategory: e.target.value })}
              className="!w-[170px] !py-1.5 text-xs"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </SelectInput>
            <span className="text-[11px] text-ink-500">Period: {filters.useCustomRange ? `${dateLabel(filters.from)} → ${dateLabel(filters.to)}` : filters.month}</span>
          </div>
          {loading && !data ? (
            <LoadingRows rows={7} />
          ) : (
            <DataTable<ExpenseRow>
              rows={rows}
              columns={columns}
              rowKey={(r) => r.id}
              initialSort={{ key: "amount", dir: "desc" }}
              pageSize={10}
              searchPrompt="Search description, vendor, remarks…"
              empty={{ title: "No expenses in this period", hint: "Click “＋ Other Expense” to add the first one." }}
              summary={(rs) => (
                <span className="font-medium">
                  Total shown: {money(rs.reduce((s, r) => s + r.amount, 0))} across {rs.length} record{rs.length === 1 ? "" : "s"}
                </span>
              )}
            />
          )}
        </Card>

        <Card>
          <h3 className="mb-2 text-sm font-semibold">Where the money went</h3>
          {data?.byCategory?.length ? (
            <DonutChart
              data={data.byCategory}
              centerLabel="Expenses"
              centerValue={formatMoney(total, settings?.school.currencySymbol)}
              height={200}
              formatter={(v) => `${money(v)}`}
            />
          ) : (
            <p className="py-8 text-center text-xs text-ink-500">Add an expense to see the split.</p>
          )}
          <ul className="mt-3 space-y-1.5 border-t border-ink-100 pt-2 text-xs dark:border-ink-800">
            {["Electricity", "Water", "Stationery", "Books", "Furniture", "Repairs", "Cleaning", "Transport", "Events"].map((c) => (
              <li key={c} className="flex items-center justify-between">
                <span className="text-ink-500">{c}</span>
                <button
                  className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
                  onClick={() => {
                    setEditing(null);
                    setOpen(true);
                    window.setTimeout(() => window.dispatchEvent(new CustomEvent("iqra:prefill-category", { detail: c })), 30);
                  }}
                >
                  quick add
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <ExpenseModal
        open={open}
        editing={editing}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSaved={() => {
          setOpen(false);
          setEditing(null);
          reload();
          notifyChange("all");
        }}
      />
    </div>
  );
}

function VoidExpense({ id, onDone }: { id: number; onDone: () => void }) {
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        const reason = window.prompt("Why is this expense being voided? The record stays in history.", "Entered by mistake");
        if (reason === null) return;
        setBusy(true);
        try {
          const res = await api<{ message: string }>("/api/expenses/" + id, { method: "DELETE", json: { reason } });
          toast(res.message || "Expense voided", "info");
          onDone();
        } catch (err) {
          toast((err as Error).message, "error");
        } finally {
          setBusy(false);
        }
      }}
      className="rounded-lg px-1.5 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-500/10"
    >
      Void
    </button>
  );
}

function ExpenseModal({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: ExpenseRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { settings, toast } = useApp();
  const categories = settings?.expenseCategories ?? ["Other"];
  const [category, setCategory] = useState(categories[0] ?? "Other");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayYmd());
  const [paidTo, setPaidTo] = useState("");
  const [method, setMethod] = useState("Cash");
  const [remarks, setRemarks] = useState("");
  const [picture, setPicture] = useState<PictureValue>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCategory(editing?.category ?? categories[0] ?? "Other");
    setTitle(editing?.title ?? "");
    setAmount(editing ? String(editing.amount) : "");
    setDate(editing?.expenseDate ?? todayYmd());
    setPaidTo(editing?.paidTo ?? "");
    setMethod(editing?.method ?? "Cash");
    setRemarks(editing?.remarks ?? "");
    setPicture(null);
    setRemoveAttachment(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setCategory(detail);
    };
    window.addEventListener("iqra:prefill-category", handler);
    return () => window.removeEventListener("iqra:prefill-category", handler);
  }, []);

  const save = async () => {
    const value = Number(amount.replace(/[^0-9]/g, "")) || 0;
    if (value <= 0) return toast("Enter the expense amount.", "error");
    if (!title.trim()) return toast("Please write a short description of the expense.", "error");
    setBusy(true);
    try {
      const payload = {
        category,
        title: title.trim(),
        amount: value,
        date,
        expenseDate: date,
        paidTo: paidTo.trim(),
        method,
        remarks: remarks.trim(),
        attachmentBase64: picture?.base64,
        attachmentName: picture?.fileName,
        attachmentType: picture?.contentType,
        removeAttachment,
      };
      const res = await api<{ message: string }>(editing ? `/api/expenses/${editing.id}` : "/api/expenses", {
        method: editing ? "PATCH" : "POST",
        json: payload,
      });
      toast(res.message || "Saved", "success");
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
      title={editing ? "Edit Expense Record" : "Add Other School Expense"}
      subtitle={editing ? `Record ${editing.docNo} · void records stay in history` : "Money OUT — this reduces the school balance"}
      width="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void save()} loading={busy}>{editing ? "Save Changes" : "Save Expense"}</Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Category" required>
          <SelectInput value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Amount" required hint="Numbers only">
          <TextInput inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="e.g. 6500" />
        </Field>
        <Field label="Description" required className="sm:col-span-2">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Monthly electricity bill — February" />
        </Field>
        <Field label="Date">
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Paid to (shop / person)">
          <TextInput value={paidTo} onChange={(e) => setPaidTo(e.target.value)} placeholder="e.g. Ali Electronics" />
        </Field>
        <Field label="Payment method">
          <SelectInput value={method} onChange={(e) => setMethod(e.target.value)}>
            {(settings?.paymentMethods ?? ["Cash"]).map((m) => (
              <option key={m}>{m}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Remarks">
          <TextInput value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <PictureInput
            existingId={editing?.attachmentId ?? null}
            removeExisting={() => setRemoveAttachment(true)}
            onChange={setPicture}
            label="Bill / receipt picture"
          />
        </div>
      </div>
    </Modal>
  );
}

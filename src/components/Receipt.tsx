"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { buildReceiptPdf } from "@/lib/pdf";
import { useApp } from "@/components/Providers";
import { Badge, Button, Card, KeyValue, Modal, Money, Spinner, StatusBadge } from "@/components/ui";
import { cn, dateLabel, formatMoney, ymLabel } from "@/lib/utils";

type ReceiptData = {
  kind: "fee" | "salary";
  docNo: string;
  date: string;
  personName: string;
  detail: string;
  month: string;
  monthlyAmount: number;
  prevDue: number;
  amount: number;
  remaining: number;
  method: string;
  remarks: string;
  attachmentId: number | null;
};

/** Small button that loads a payment, shows a printable receipt and offers PDF download. */
export function ReceiptButton({ kind, id, label = "Receipt" }: { kind: "fee" | "salary"; id: number; label?: string }) {
  const { settings, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ReceiptData | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    setOpen(true);
    try {
      const res = await api<Record<string, unknown>>(`/api/${kind === "fee" ? "fee-payments" : "salary-payments"}/${id}`);
      const row = (res.payment ?? {}) as Record<string, unknown>;
      setData({
        kind,
        docNo: String(row.receiptNo ?? row.referenceNo ?? "—"),
        date: String(row.paymentDate ?? ""),
        personName: String(row.studentName ?? row.teacherName ?? "—"),
        detail:
          kind === "fee"
            ? `${row.className ?? ""}-${row.section ?? ""} · ${row.fatherName ?? ""}`
            : `${row.subject ?? ""} · ${row.teacherCode ?? ""}`,
        month: ymLabel(String(row.feeMonth ?? row.salaryMonth ?? "2026-01")),
        monthlyAmount: Number(kind === "fee" ? row.monthlyFee ?? 0 : row.monthlySalary ?? 0),
        prevDue: 0,
        amount: Number(row.amount ?? 0),
        remaining: Math.max(0, Number(kind === "fee" ? row.monthlyFee ?? 0 : row.monthlySalary ?? 0) - Number(row.amount ?? 0)),
        method: String(row.method ?? "Cash"),
        remarks: String(row.remarks ?? ""),
        attachmentId: row.attachmentId ? Number(row.attachmentId) : null,
      });
    } catch (err) {
      toast((err as Error).message || "Could not load the receipt", "error");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={load}
        className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-semibold text-brand-700 transition hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/40"
        title="View / download receipt"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 3h10v18l-2.5-1.6L12 21l-2.5-1.6L7 21z" strokeLinejoin="round" />
          <path d="M10 8h4M10 12h4" strokeLinecap="round" />
        </svg>
        {label}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={kind === "fee" ? "Fee Payment Receipt" : "Salary Payment Slip"}
        subtitle={data?.docNo}
        width="max-w-lg"
        footer={
          <>
            <Button variant="outline" onClick={() => window.print()}>Print</Button>
            <Button
              onClick={() => {
                if (!data) return;
                void buildReceiptPdf({ settings, ...data, imageUrl: data.attachmentId ? `/api/attachments/${data.attachmentId}` : null });
              }}
              icon={<IconDl />}
            >
              Download PDF
            </Button>
          </>
        }
      >
        {busy || !data ? (
          <div className="grid place-items-center py-10">
            <Spinner className="h-6 w-6 text-brand-600" />
          </div>
        ) : (
          <div className="space-y-3" id="print-area">
            <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 text-center dark:border-brand-800 dark:bg-brand-900/25">
              <p className="text-[15px] font-bold text-ink-900 dark:text-white">{settings?.school.name}</p>
              <p className="text-[11px] text-ink-500 dark:text-ink-400">{settings?.school.tagline}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                {kind === "fee" ? "Fee Receipt" : "Salary Slip"} · {data.docNo}
              </p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-brand-700 dark:text-brand-300">
                {formatMoney(data.amount, settings?.school.currencySymbol)}
              </p>
              <p className="text-[11px] text-ink-500">{dateLabel(data.date)} · {data.method}</p>
            </div>
            <KeyValue
              items={[
                { label: kind === "fee" ? "Student" : "Teacher", value: data.personName },
                { label: "Detail", value: data.detail },
                { label: "For Month", value: data.month },
                { label: kind === "fee" ? "Monthly Fee" : "Monthly Salary", value: <Money value={data.monthlyAmount} /> },
                { label: "Amount Paid", value: <Money value={data.amount} className="text-brand-700 dark:text-brand-300" /> },
                { label: "Remaining", value: <Money value={data.remaining} className="text-amber-700 dark:text-amber-300" /> },
                { label: "Remarks", value: data.remarks || "—" },
              ]}
            />
            {data.attachmentId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/attachments/${data.attachmentId}`} alt="Payment proof" className="max-h-64 w-full rounded-xl border border-ink-200 object-contain dark:border-ink-700" />
            ) : null}
            <div className="flex items-center justify-between">
              <Badge tone="green">Saved in database</Badge>
              <span className="text-[10px] text-ink-400">{settings?.school.createdBy}</span>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function IconDl() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v11m0 0 4-4m-4 4-4-4M4 20h16" strokeLinecap="round" />
    </svg>
  );
}

export function InlineVoid({ onVoid, className }: { onVoid: (reason: string) => Promise<void>; className?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        const reason = window.prompt("Reason for voiding this record (history is kept):", "Entered by mistake");
        if (reason === null) return;
        setBusy(true);
        try {
          await onVoid(reason);
        } finally {
          setBusy(false);
        }
      }}
      className={cn(
        "rounded-lg px-1.5 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-500/10",
        className,
      )}
    >
      {busy ? "…" : "Void"}
    </button>
  );
}

export function StatusDot({ status }: { status: string }) {
  const color = status === "paid" ? "bg-emerald-500" : status === "partial" ? "bg-amber-500" : "bg-rose-500";
  return <span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full", color)} />;
}

export { StatusBadge };

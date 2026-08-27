"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Providers";
import { api, notifyChange, useJson } from "@/lib/api";
import { downloadStudentHistory, downloadTeacherHistory } from "@/lib/reports";
import { DataTable, type Column } from "@/components/DataTable";
import { ReceiptButton } from "@/components/Receipt";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  Grid,
  KeyValue,
  LoadingRows,
  Modal,
  Money,
  Panel,
  ProgressBar,
  SelectInput,
  StatCard,
  StatusBadge,
  TextArea,
  TextInput,
} from "@/components/ui";
import type { StudentProfile, TeacherProfile } from "@/lib/viewTypes";
import { dateLabel, pct, ymLabel } from "@/lib/utils";

/* ------------------------------- student view ------------------------------ */

export function StudentProfileView({ id }: { id: string }) {
  const { settings, money, filters, toast } = useApp();
  const { data, loading, reload } = useJson<StudentProfile>(`/api/students/${id}`);
  const [collect, setCollect] = useState(false);
  const [edit, setEdit] = useState(false);
  if (loading && !data) return <LoadingRows rows={6} />;
  if (!data?.student) return <Card>Student record not found. <Link href="/students" className="underline">Back to students</Link></Card>;
  const s = data.student;
  const monthRow = data.history.find((h) => h.ym === filters.month);
  const status = monthRow ? (monthRow.remaining === 0 ? "paid" : monthRow.paid > 0 ? "partial" : "unpaid") : "unpaid";

  const columns: Column<NonNullable<StudentProfile["payments"][number]> & Record<string, unknown>>[] = [
    { key: "paymentDate", label: "Date", render: (r) => <span className="text-xs">{dateLabel(r.paymentDate)}</span> },
    { key: "feeMonth", label: "Fee For Month", render: (r) => <span className="text-xs font-medium">{ymLabel(r.feeMonth)}</span> },
    { key: "receiptNo", label: "Receipt No.", render: (r) => <span className="font-mono text-[11px]">{r.receiptNo}</span> },
    { key: "method", label: "Method", align: "center", hideBelow: "md", render: (r) => <Badge tone="slate">{r.method}</Badge> },
    { key: "amount", label: "Amount", align: "right", render: (r) => <Money value={r.amount} className="font-bold text-brand-700 dark:text-brand-300" /> },
    { key: "remarks", label: "Remarks", hideBelow: "lg", render: (r) => <span className="text-[11px] text-ink-500">{r.remarks || "—"}</span> },
    {
      key: "attachmentId",
      label: "Proof",
      align: "center",
      render: (r) => (r.attachmentId ? <a className="text-[11px] font-semibold text-sky-700 hover:underline dark:text-sky-300" href={`/api/attachments/${r.attachmentId}`} target="_blank" rel="noreferrer">📎 View</a> : <span className="text-ink-300">—</span>),
    },
    { key: "id", label: "Receipt", align: "right", sortValue: () => 0, render: (r) => (r.voided ? <Badge tone="slate">Void</Badge> : <ReceiptButton kind="fee" id={r.id} />) },
  ];

  return (
    <div className="space-y-4">
      <Link href="/students" className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-brand-700 dark:text-ink-400">
        ← Back to all students
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={s.name} photoId={s.photoId} size={64} />
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">{s.name}</h1>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                {s.studentCode} · Admission {s.admissionNo} · Class {s.className}-{s.section} · {s.gender} · Admitted {dateLabel(s.admissionDate)}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <StatusBadge status={status} />
                <StatusBadge status={s.status} />
                {monthRow ? <Badge tone="blue">{ymLabel(filters.month)}: {money(monthRow.paid)} of {money(monthRow.expected)}</Badge> : <Badge tone="slate">Not billed for {ymLabel(filters.month)}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void downloadStudentHistory(data, settings).then(() => toast("Student fee history PDF downloaded"))}>Fee History PDF</Button>
            <Button variant="outline" size="sm" onClick={() => setEdit(true)}>Edit Details</Button>
            <Button size="sm" onClick={() => setCollect(true)}>＋ Collect Fee</Button>
          </div>
        </div>
        <div className="mt-3 border-t border-ink-100 pt-3 dark:border-ink-800">
          <KeyValue
            items={[
              { label: "Father / Guardian", value: s.fatherName },
              { label: "Contact", value: s.contact || "—" },
              { label: "Address", value: s.address || "—" },
              { label: "Monthly Fee", value: money(s.monthlyFee) },
              { label: "Notes", value: s.notes || "—" },
            ]}
          />
        </div>
      </Card>

      <Grid cols={4}>
        <StatCard label="Total Paid (all time)" value={money(data.totals.paid)} hint={`${data.totals.monthsBilled} month(s) billed`} tone="green" />
        <StatCard label="Current Due" value={money(data.totals.due)} hint={data.totals.due > 0 ? "Includes old months" : "Nothing pending"} tone={data.totals.due > 0 ? "red" : "green"} />
        <StatCard label="Payment Progress" value={`${pct(data.totals.paid, Math.max(1, data.totals.billed))}%`} hint={`${money(data.totals.billed)} billed in total`} tone="blue" progress={pct(data.totals.paid, Math.max(1, data.totals.billed))} />
        <StatCard label="Last Payment" value={data.totals.lastPaymentDate ? dateLabel(data.totals.lastPaymentDate) : "—"} hint={`${data.payments.filter((p) => !p.voided).length} payment record(s)`} tone="violet" />
      </Grid>

      <Panel
        title={`Monthly fee history — ${ymLabel(filters.month)}`}
        right={<span className="text-[11px] text-ink-500">Same student record, every month</span>}
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.history.slice(0, 12).map((h) => (
            <div key={h.ym} className="rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-800">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold">{h.label}</p>
                <StatusBadge status={h.status.toLowerCase()} />
              </div>
              <p className="mt-1 text-[11px] text-ink-500">
                Fee {money(h.expected)} · Paid <span className="font-semibold text-brand-700 dark:text-brand-300">{money(h.paid)}</span> · Remaining{" "}
                <span className={h.remaining > 0 ? "font-semibold text-rose-600" : "font-semibold text-emerald-600"}>{money(h.remaining)}</span>
              </p>
              <ProgressBar value={pct(h.paid, Math.max(1, h.expected))} tone={h.remaining > 0 ? "amber" : "brand"} />
            </div>
          ))}
          {!data.history.length ? <p className="text-xs text-ink-500">No billed months yet for this student.</p> : null}
        </div>
      </Panel>

      <Card>
        <h3 className="mb-3 text-sm font-semibold">Previous payments</h3>
        <DataTable
          rows={data.payments as never}
          columns={columns as never}
          rowKey={(r) => r.id as number}
          initialSort={{ key: "paymentDate", dir: "desc" }}
          pageSize={10}
          searchPrompt="Search receipt no, month, remarks…"
          empty={{ title: "No payments recorded yet" }}
          summary={(rs) => <span className="font-medium">Total paid: {money(rs.reduce((sum, r) => sum + (r.voided ? 0 : (r.amount as number)), 0))}</span>}
        />
      </Card>

      <CollectForStudent
        open={collect}
        studentId={s.id}
        month={filters.month}
        monthlyFee={s.monthlyFee}
        due={monthRow?.remaining ?? data.totals.due}
        onClose={() => setCollect(false)}
        onSaved={() => {
          setCollect(false);
          reload();
          notifyChange("students");
        }}
      />
      <EditStudent open={edit} student={s} onClose={() => setEdit(false)} onSaved={() => { setEdit(false); reload(); notifyChange("students"); }} />
    </div>
  );
}

function CollectForStudent({
  open,
  studentId,
  month,
  monthlyFee,
  due,
  onClose,
  onSaved,
}: {
  open: boolean;
  studentId: number;
  month: string;
  monthlyFee: number;
  due: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { money, toast } = useApp();
  const [amount, setAmount] = useState(String(Math.max(0, due) || monthlyFee));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("Cash");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const value = Number(amount || 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Collect Fee"
      subtitle={`${ymLabel(month)} · remaining ${money(Math.max(0, due))}`}
      width="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            loading={busy}
            disabled={value <= 0}
            onClick={async () => {
              setBusy(true);
              try {
                const res = await api<{ message: string; payment: { receiptNo: string } }>("/api/fee-payments", {
                  method: "POST",
                  json: { studentId, feeMonth: month, amount: value, paymentDate: date, method, remarks },
                });
                toast(`${res.message}`, "success");
                onSaved();
              } catch (err) {
                toast((err as Error).message, "error");
              } finally {
                setBusy(false);
              }
            }}
          >
            Save Payment
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Amount paying now" required hint={`Remaining fee: ${money(Math.max(0, due))} — partial payments are allowed`}>
          <TextInput inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Payment date">
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Method">
            <SelectInput value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>EasyPaisa</option>
              <option>JazzCash</option>
              <option>Cheque</option>
            </SelectInput>
          </Field>
        </div>
        <Field label="Remarks">
          <TextArea value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </Field>
        <div className="rounded-xl bg-ink-50 px-3 py-2 text-center text-xs dark:bg-ink-800/50">
          Remaining after payment:{" "}
          <strong className="tabular-nums">{money(Math.max(0, Math.max(0, due) - value))}</strong>
        </div>
      </div>
    </Modal>
  );
}

function EditStudent({ open, student, onClose, onSaved }: { open: boolean; student: StudentProfile["student"]; onClose: () => void; onSaved: () => void }) {
  const { toast } = useApp();
  const [form, setForm] = useState({ name: student.name, fatherName: student.fatherName, contact: student.contact, address: student.address, monthlyFee: String(student.monthlyFee), notes: student.notes, status: student.status });
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Student Record"
      subtitle="The same record is updated — history is never duplicated"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api(`/api/students/${student.id}`, { method: "PATCH", json: { ...form, monthlyFee: Number(form.monthlyFee || 0) } });
                toast("Student record updated", "success");
                onSaved();
              } catch (err) {
                toast((err as Error).message, "error");
              } finally {
                setBusy(false);
              }
            }}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Student Name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Father / Guardian"><TextInput value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} /></Field>
        <Field label="Contact"><TextInput value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></Field>
        <Field label="Monthly Fee"><TextInput inputMode="numeric" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value.replace(/[^0-9]/g, "") })} /></Field>
        <Field label="Address" className="sm:col-span-2"><TextInput value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
        <Field label="Status">
          <SelectInput value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Archived</option>
            <option value="graduated">Passed out</option>
          </SelectInput>
        </Field>
        <Field label="Notes"><TextArea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

/* ------------------------------- teacher view ------------------------------- */

export function TeacherProfileView({ id }: { id: string }) {
  const { settings, money, filters, toast } = useApp();
  const { data, loading, reload } = useJson<TeacherProfile>(`/api/teachers/${id}`);
  if (loading && !data) return <LoadingRows rows={5} />;
  if (!data?.teacher) return <Card>Teacher record not found. <Link href="/teachers" className="underline">Back to teachers</Link></Card>;
  const t = data.teacher;

  const columns: Column<NonNullable<TeacherProfile["payments"][number]> & Record<string, unknown>>[] = [
    { key: "paymentDate", label: "Paid On", render: (r) => <span className="text-xs">{dateLabel(r.paymentDate)}</span> },
    { key: "salaryMonth", label: "Salary Month", render: (r) => <span className="text-xs font-medium">{ymLabel(r.salaryMonth)}</span> },
    { key: "referenceNo", label: "Reference", render: (r) => <span className="font-mono text-[11px]">{r.referenceNo}</span> },
    { key: "method", label: "Method", align: "center", hideBelow: "md", render: (r) => <Badge tone="slate">{r.method}</Badge> },
    { key: "amount", label: "Amount", align: "right", render: (r) => <Money value={r.amount} className="font-bold" /> },
    { key: "remarks", label: "Remarks", hideBelow: "lg", render: (r) => <span className="text-[11px] text-ink-500">{r.remarks || "—"}</span> },
    { key: "id", label: "Slip", align: "right", sortValue: () => 0, render: (r) => (r.voided ? <Badge tone="slate">Void</Badge> : <ReceiptButton kind="salary" id={r.id as number} />) },
  ];

  return (
    <div className="space-y-4">
      <Link href="/teachers" className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-brand-700 dark:text-ink-400">
        ← Back to all teachers
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={t.name} photoId={t.photoId} size={64} />
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">{t.name}</h1>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                {t.teacherCode} · {t.subject} · Joined {dateLabel(t.joiningDate)} · {t.contact || "no contact"}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <StatusBadge status={t.status} />
                {data.totals.due > 0 ? <Badge tone="red">Salary due {money(data.totals.due)}</Badge> : <Badge tone="green">Salary clear</Badge>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void downloadTeacherHistory(data, settings).then(() => toast("Salary history PDF downloaded"))}>Salary History PDF</Button>
            <Link href="/salaries"><Button size="sm">Pay Salary →</Button></Link>
          </div>
        </div>
        <div className="mt-3 border-t border-ink-100 pt-3 dark:border-ink-800">
          <KeyValue items={[{ label: "Qualification", value: t.qualification || "—" }, { label: "Monthly Salary", value: money(t.monthlySalary) }, { label: "Total Paid", value: money(data.totals.paid) }, { label: "Months On Roll", value: String(data.totals.monthsBilled) }, { label: "Notes", value: t.notes || "—" }]} />
        </div>
      </Card>

      <Grid cols={4}>
        <StatCard label="Monthly Salary" value={money(t.monthlySalary)} hint={`Since ${dateLabel(t.joiningDate)}`} tone="violet" />
        <StatCard label="Paid (all time)" value={money(data.totals.paid)} hint={`${data.payments.filter((p) => !p.voided).length} payment(s)`} tone="green" />
        <StatCard label="Current Salary Due" value={money(data.totals.due)} hint={`Up to ${ymLabel(filters.month)}`} tone={data.totals.due > 0 ? "red" : "green"} />
        <StatCard label="Salary Progress" value={`${pct(data.totals.paid, Math.max(1, data.totals.billed))}%`} hint={`${money(data.totals.billed)} billed in total`} tone="blue" progress={pct(data.totals.paid, Math.max(1, data.totals.billed))} />
      </Grid>

      <Card>
        <h3 className="mb-3 text-sm font-semibold">Complete salary history</h3>
        <DataTable
          rows={data.payments as never}
          columns={columns as never}
          rowKey={(r) => r.id as number}
          initialSort={{ key: "paymentDate", dir: "desc" }}
          pageSize={12}
          searchPrompt="Search reference, month, remarks…"
          empty={{ title: "No salary payments recorded yet" }}
          summary={(rs) => <span className="font-medium">Total: {money(rs.reduce((sum, r) => sum + (r.voided ? 0 : (r.amount as number)), 0))}</span>}
        />
      </Card>
    </div>
  );
}

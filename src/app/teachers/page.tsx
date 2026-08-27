"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Providers";
import { api, notifyChange, useJson } from "@/lib/api";
import { DataTable, type Column } from "@/components/DataTable";
import { PictureInput, type PictureValue } from "@/components/PictureInput";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Confirm,
  Field,
  Grid,
  LoadingRows,
  Modal,
  Money,
  SelectInput,
  StatCard,
  StatusBadge,
  TextArea,
  TextInput,
} from "@/components/ui";
import type { SalaryRow } from "@/lib/viewTypes";
import { dateLabel, todayYmd } from "@/lib/utils";

type Sheets = { salary: SalaryRow[]; totals: { salaryExpected: number; salaryPaid: number; salaryRemaining: number } };

export default function TeachersPage() {
  const { filters, settings, money, toast } = useApp();
  const [recordStatus, setRecordStatus] = useState("active");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SalaryRow | null>(null);
  const [archive, setArchive] = useState<SalaryRow | null>(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("month", filters.month);
    p.set("status", recordStatus);
    if (filters.q) p.set("q", filters.q);
    return p.toString();
  }, [filters, recordStatus]);

  const { data, loading, reload } = useJson<Sheets>(`/api/sheets?${query}`);
  const rows = data?.salary ?? [];

  const columns: Column<SalaryRow>[] = [
    {
      key: "name",
      label: "Teacher",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.name} photoId={r.photoId} size={34} />
          <div className="min-w-0">
            <Link href={`/teachers/profile?id=${r.id}`} className="block truncate font-semibold hover:text-brand-700 dark:hover:text-brand-300">
              {r.name}
            </Link>
            <span className="text-[11px] text-ink-500">{r.teacherCode}</span>
          </div>
        </div>
      ),
    },
    { key: "subject", label: "Subject", render: (r) => <Badge tone="blue">{r.subject}</Badge> },
    { key: "contact", label: "Contact", hideBelow: "md", render: (r) => <span className="text-xs">{r.contact || "—"}</span> },
    { key: "joiningDate", label: "Joined", align: "center", hideBelow: "lg", render: (r) => <span className="text-xs">{dateLabel(r.joiningDate)}</span> },
    { key: "monthlySalary", label: "Monthly Salary", align: "right", render: (r) => <Money value={r.monthlySalary} className="font-semibold" /> },
    { key: "totalPaid", label: "Total Paid", align: "right", render: (r) => <Money value={r.totalPaid} /> },
    { key: "totalDue", label: "Salary Due", align: "right", render: (r) => (r.totalDue > 0 ? <Money value={r.totalDue} className="font-bold text-rose-600 dark:text-rose-400" /> : <span className="text-emerald-600">Clear</span>) },
    { key: "status", label: "This Month", align: "center", render: (r) => <StatusBadge status={r.status} /> },
    { key: "recordStatus", label: "Record", align: "center", render: (r) => <StatusBadge status={r.recordStatus} /> },
    {
      key: "actions",
      label: "",
      align: "right",
      sortValue: () => 0,
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/teachers/profile?id=${r.id}`} className="rounded-lg px-1.5 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/40">
            Profile
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(r);
              setOpen(true);
            }}
            className="rounded-lg px-1.5 py-1 text-[11px] font-semibold text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
          >
            Edit
          </button>
          {r.recordStatus === "active" ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setArchive(r);
              }}
              className="rounded-lg px-1.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
            >
              Archive
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Teachers</h1>
          <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
            Register each teacher once. The same record continues for every future salary month — no duplicate staff records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/salaries">
            <Button variant="soft" size="sm">Teacher Salary →</Button>
          </Link>
          <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>＋ Register Teacher</Button>
        </div>
      </div>

      <Grid cols={4}>
        <StatCard label="Teachers in view" value={rows.length} hint={`Active: ${rows.filter((r) => r.recordStatus === "active").length}`} tone="blue" />
        <StatCard label="Monthly salary bill" value={money(rows.reduce((s, r) => s + r.monthlySalary, 0))} hint="Total fixed monthly cost" tone="violet" />
        <StatCard label="Paid this month" value={money(data?.totals.salaryPaid ?? 0)} hint={`Bill ${money(data?.totals.salaryExpected ?? 0)}`} tone="green" />
        <StatCard label="Salary remaining" value={money(data?.totals.salaryRemaining ?? 0)} hint={`${rows.filter((r) => r.status !== "paid").length} teacher(s) pending`} tone={data?.totals.salaryRemaining ? "red" : "green"} />
      </Grid>

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SelectInput value={recordStatus} onChange={(e) => setRecordStatus(e.target.value)} className="!w-[160px] !py-1.5 text-xs">
            <option value="active">Active teachers</option>
            <option value="inactive">Archived teachers</option>
            <option value="all">All records</option>
          </SelectInput>
          <span className="text-[11px] text-ink-500">Search by name, Teacher ID or subject — from the top bar or the table box.</span>
        </div>
        {loading && !data ? (
          <LoadingRows rows={5} />
        ) : (
          <DataTable<SalaryRow>
            rows={rows}
            columns={columns}
            rowKey={(r) => r.id}
            initialSort={{ key: "name", dir: "asc" }}
            pageSize={10}
            searchPrompt="Search teacher, subject, teacher ID…"
            empty={{
              title: "No teachers registered",
              hint: "Click “＋ Register Teacher” to add your first staff member.",
              action: <Button size="sm" onClick={() => setOpen(true)}>＋ Register Teacher</Button>,
            }}
            summary={(rs) => (
              <span className="font-medium">
                {rs.length} teachers · monthly {money(rs.reduce((s, r) => s + r.monthlySalary, 0))} · paid {money(rs.reduce((s, r) => s + r.paid, 0))} · remaining{" "}
                {money(rs.reduce((s, r) => s + r.remaining, 0))}
              </span>
            )}
          />
        )}
      </Card>

      <TeacherModal
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
          notifyChange("students");
        }}
      />

      <Confirm
        open={Boolean(archive)}
        title="Archive this teacher?"
        confirmLabel="Archive record"
        message={
          <>
            <strong>{archive?.name}</strong> will be marked inactive and stop appearing in new salary sheets. Salary history is kept — nothing is deleted.
          </>
        }
        onCancel={() => setArchive(null)}
        onConfirm={async () => {
          if (!archive) return;
          try {
            const res = await api<{ message: string }>(`/api/teachers/${archive.id}`, { method: "DELETE", json: {} });
            toast(res.message || "Archived", "info");
            setArchive(null);
            reload();
            notifyChange("students");
          } catch (err) {
            toast((err as Error).message, "error");
          }
        }}
      />
    </div>
  );
}

function TeacherModal({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: SalaryRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { settings, toast } = useApp();
  const [form, setForm] = useState({
    name: "",
    subject: "",
    qualification: "",
    contact: "",
    teacherCode: "",
    joiningDate: todayYmd(),
    monthlySalary: "",
    status: "active",
    notes: "",
  });
  const [picture, setPicture] = useState<PictureValue>(null);
  const [busy, setBusy] = useState(false);
  const [force, setForce] = useState(false);
  const [duplicateOf, setDuplicateOf] = useState<{ id: number; name: string; teacherCode: string; subject: string }[] | null>(null);

  useEffect(() => {
    if (!open) return;
    setPicture(null);
    setDuplicateOf(null);
    setForce(false);
    if (editing) {
      setForm({
        name: editing.name,
        subject: editing.subject,
        qualification: editing.qualification ?? "",
        contact: editing.contact,
        teacherCode: editing.teacherCode,
        joiningDate: editing.joiningDate,
        monthlySalary: String(editing.monthlySalary),
        status: editing.recordStatus,
        notes: editing.notes ?? "",
      });
    } else {
      setForm({
        name: "",
        subject: settings?.subjects[0] ?? "",
        qualification: "",
        contact: "",
        teacherCode: "",
        joiningDate: todayYmd(),
        monthlySalary: String(settings?.salaryDefaults.defaultSalary ?? 30000),
        status: "active",
        notes: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.name.trim()) return toast("Teacher name is required.", "error");
    if (!form.subject.trim()) return toast("Please choose a subject.", "error");
    if (!Number(form.monthlySalary)) return toast("Monthly salary must be greater than 0.", "error");
    setBusy(true);
    try {
      if (editing) {
        await api(`/api/teachers/${editing.id}`, {
          method: "PATCH",
          json: { ...form, monthlySalary: Number(form.monthlySalary), photoBase64: picture?.base64, photoName: picture?.fileName, photoType: picture?.contentType },
        });
        toast("Teacher record updated", "success");
      } else {
        const res = await api<{ duplicate?: boolean; matches?: typeof duplicateOf; message?: string }>("/api/teachers", {
          method: "POST",
          json: { ...form, monthlySalary: Number(form.monthlySalary), allowDuplicate: force, photoBase64: picture?.base64, photoName: picture?.fileName, photoType: picture?.contentType },
        });
        if (res.duplicate) {
          setDuplicateOf(res.matches ?? []);
          toast("Possible duplicate teacher found — please confirm below.", "error");
          setBusy(false);
          return;
        }
        toast(res.message || "Teacher registered", "success");
      }
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
      title={editing ? `Edit Teacher — ${editing.name}` : "Register New Teacher"}
      subtitle={editing ? "The salary history of this teacher stays intact" : "One teacher record, used for every salary month"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void save()} loading={busy}>{editing ? "Save Changes" : "Register Teacher"}</Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Teacher Name" required>
          <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Ms. Sadia Kamran" />
        </Field>
        <Field label="Subject" required>
          <SelectInput value={form.subject} onChange={(e) => set({ subject: e.target.value })}>
            {(settings?.subjects ?? []).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Teacher ID" hint="Leave empty to auto-generate">
          <TextInput value={form.teacherCode} onChange={(e) => set({ teacherCode: e.target.value.toUpperCase() })} placeholder="e.g. IIS-T-2026-03" />
        </Field>
        <Field label="Qualification">
          <TextInput value={form.qualification} onChange={(e) => set({ qualification: e.target.value })} placeholder="e.g. MSc Mathematics, B.Ed" />
        </Field>
        <Field label="Contact Number">
          <TextInput value={form.contact} onChange={(e) => set({ contact: e.target.value })} placeholder="+92 300 1234567" />
        </Field>
        <Field label="Joining Date">
          <TextInput type="date" value={form.joiningDate} onChange={(e) => set({ joiningDate: e.target.value })} />
        </Field>
        <Field label="Monthly Salary" required hint={`Default ${settings?.salaryDefaults.defaultSalary ?? 30000}`}>
          <TextInput inputMode="numeric" value={form.monthlySalary} onChange={(e) => set({ monthlySalary: e.target.value.replace(/[^0-9]/g, "") })} />
        </Field>
        {editing ? (
          <Field label="Record Status">
            <SelectInput value={form.status} onChange={(e) => set({ status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Archived / Left</option>
            </SelectInput>
          </Field>
        ) : null}
        <Field label="Notes" className="sm:col-span-2">
          <TextArea value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
        </Field>
        <div className="sm:col-span-2">
          <PictureInput existingId={editing?.photoId ?? null} onChange={setPicture} label="Teacher picture (optional)" />
        </div>
        {duplicateOf?.length ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 sm:col-span-2">
            <p className="font-semibold">⚠ A teacher with a similar name already exists:</p>
            {duplicateOf.map((d) => (
              <p key={d.id}>
                <Link href={`/teachers/profile?id=${d.id}`} className="underline" target="_blank">
                  {d.name} · {d.subject} · {d.teacherCode}
                </Link>
              </p>
            ))}
            <label className="mt-2 flex items-center gap-2">
              <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
              This is a different teacher — register anyway
            </label>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

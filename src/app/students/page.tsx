"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Providers";
import { api, notifyChange, useJson } from "@/lib/api";
import { takeAction } from "@/lib/nav";
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
  Switch,
  TextArea,
  TextInput,
} from "@/components/ui";
import type { FeeRow } from "@/lib/viewTypes";
import { currentYm, dateLabel, todayYmd, ymLabel } from "@/lib/utils";

type Sheets = { fee: FeeRow[]; totals: { feesExpected: number; feesPaid: number; feesRemaining: number } };

export default function StudentsPage() {
  const { filters, setFilters, settings, money, toast } = useApp();
  const [recordStatus, setRecordStatus] = useState("active");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FeeRow | null>(null);
  const [archive, setArchive] = useState<FeeRow | null>(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("month", filters.month);
    p.set("status", recordStatus);
    if (filters.className) p.set("className", filters.className);
    if (filters.section) p.set("section", filters.section);
    if (filters.q) p.set("q", filters.q);
    if (filters.feeStatus && filters.feeStatus !== "all") p.set("feeStatus", filters.feeStatus);
    return p.toString();
  }, [filters, recordStatus]);

  const { data, loading, reload } = useJson<Sheets>(`/api/sheets?${query}`);
  const rows = data?.fee ?? [];

  useEffect(() => {
    const action = takeAction();
    if (action === "add-student") {
      setEditing(null);
      setOpen(true);
    }
  }, []);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };

  const columns: Column<FeeRow>[] = [
    {
      key: "name",
      label: "Student",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.name} photoId={r.photoId} size={34} />
          <div className="min-w-0">
            <Link href={`/students/profile?id=${r.id}`} className="block truncate font-semibold hover:text-brand-700 dark:hover:text-brand-300">
              {r.name}
            </Link>
            <span className="text-[11px] text-ink-500">{r.studentCode}</span>
          </div>
        </div>
      ),
    },
    { key: "admissionNo", label: "Admission No.", hideBelow: "md", render: (r) => <span className="font-mono text-[11px]">{r.admissionNo}</span> },
    { key: "fatherName", label: "Father / Guardian" },
    { key: "className", label: "Class", align: "center", render: (r) => <Badge tone="slate">{r.className}-{r.section}</Badge> },
    { key: "contact", label: "Contact", hideBelow: "lg", render: (r) => <span className="text-xs">{r.contact || "—"}</span> },
    { key: "monthlyFee", label: "Monthly Fee", align: "right", render: (r) => <Money value={r.monthlyFee} className="font-semibold" /> },
    { key: "admissionDate", label: "Admitted", align: "center", hideBelow: "lg", render: (r) => <span className="text-xs">{dateLabel(r.admissionDate)}</span> },
    {
      key: "status",
      label: `${ymLabel(filters.month)} Fee`,
      align: "center",
      render: (r) => <StatusBadge status={r.status} />,
    },
    { key: "totalDue", label: "Total Due", align: "right", render: (r) => (r.totalDue > 0 ? <Money value={r.totalDue} className="font-bold text-rose-600 dark:text-rose-400" /> : <span className="text-emerald-600">Clear</span>) },
    { key: "recordStatus", label: "Record", align: "center", render: (r) => <StatusBadge status={r.recordStatus} /> },
    {
      key: "actions",
      label: "",
      align: "right",
      sortValue: () => 0,
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/students/profile?id=${r.id}`} className="rounded-lg px-1.5 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/40">
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

  const active = rows.filter((r) => r.recordStatus === "active").length;
  const owing = rows.filter((r) => r.totalDue > 0).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Students</h1>
          <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
            Register each student once. The same record is reused for every future month — no duplicate entries.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>Print List</Button>
          <Link href="/fees">
            <Button variant="soft" size="sm">Fee Collection →</Button>
          </Link>
          <Button size="sm" onClick={openNew}>＋ Register Student</Button>
        </div>
      </div>

      <Grid cols={4}>
        <StatCard label="Students in view" value={rows.length} hint={`Active: ${active} · Archived: ${rows.length - active}`} tone="blue" />
        <StatCard label="Monthly fee income (planned)" value={money(rows.reduce((s, r) => s + r.monthlyFee, 0))} hint="If every student pays this month" tone="green" />
        <StatCard label="Students owing money" value={owing} hint={`Total arrears ${money(rows.reduce((s, r) => s + r.totalDue, 0))}`} tone={owing ? "red" : "green"} />
        <StatCard label={`Not paid ${ymLabel(filters.month)}`} value={rows.filter((r) => r.status === "unpaid").length} hint={`Partial: ${rows.filter((r) => r.status === "partial").length}`} tone="amber" />
      </Grid>

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SelectInput value={recordStatus} onChange={(e) => setRecordStatus(e.target.value)} className="!w-[150px] !py-1.5 text-xs">
            <option value="active">Active students</option>
            <option value="inactive">Archived students</option>
            <option value="graduated">Passed out</option>
            <option value="all">All records</option>
          </SelectInput>
          <SelectInput value={filters.feeStatus || "all"} onChange={(e) => setFilters({ feeStatus: e.target.value })} className="!w-[150px] !py-1.5 text-xs">
            <option value="all">Any fee status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Not paid</option>
          </SelectInput>
          <span className="text-[11px] text-ink-500">
            Search box in the table + class/section in the top bar all work together.
          </span>
        </div>
        {loading && !data ? (
          <LoadingRows rows={8} />
        ) : (
          <DataTable<FeeRow>
            rows={rows}
            columns={columns}
            rowKey={(r) => r.id}
            initialSort={{ key: "name", dir: "asc" }}
            pageSize={settings?.ui?.pageSize ?? 10}
            searchPrompt="Search name, father, admission no, student ID…"
            empty={{
              title: "No students registered yet",
              hint: "Click “＋ Register Student” to add the first student. Try “Load sample school” in Settings to explore the system.",
              action: <Button size="sm" onClick={openNew}>＋ Register Student</Button>,
            }}
            summary={(rs) => (
              <span className="font-medium">
                {rs.length} students · monthly fees {money(rs.reduce((s, r) => s + r.monthlyFee, 0))} · paid {money(rs.reduce((s, r) => s + r.paid, 0))} · remaining{" "}
                {money(rs.reduce((s, r) => s + r.remaining, 0))}
              </span>
            )}
          />
        )}
      </Card>

      <StudentModal
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
        title="Archive this student?"
        tone="danger"
        confirmLabel="Archive record"
        message={
          <>
            <strong>{archive?.name}</strong> will be marked inactive and will stop appearing in new monthly fee sheets.
            All payment history stays saved — financial records are never deleted automatically.
          </>
        }
        onCancel={() => setArchive(null)}
        onConfirm={async () => {
          if (!archive) return;
          try {
            const res = await api<{ message: string }>(`/api/students/${archive.id}`, { method: "DELETE", json: {} });
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

/* ------------------------------ student modal ------------------------------ */

type FormState = {
  name: string;
  fatherName: string;
  admissionNo: string;
  studentCode: string;
  className: string;
  section: string;
  rollNo: string;
  contact: string;
  address: string;
  gender: string;
  monthlyFee: string;
  admissionDate: string;
  status: string;
  notes: string;
};

export function StudentModal({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: FeeRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { settings, toast } = useApp();
  const classes = settings?.classes ?? [];
  const sections = settings?.sections ?? ["A", "B", "C"];
  const [form, setForm] = useState<FormState>(emptyForm());
  const [picture, setPicture] = useState<PictureValue>(null);
  const [busy, setBusy] = useState(false);
  const [duplicates, setDuplicates] = useState<{ id: number; name: string; admissionNo: string; className: string; fatherName: string }[] | null>(null);
  const [force, setForce] = useState(false);
  const [checking, setChecking] = useState(false);
  const [match, setMatch] = useState<{ id: number; name: string; admissionNo: string; className: string; fatherName: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    setDuplicates(null);
    setForce(false);
    setPicture(null);
    setChecking(false);
    if (editing) {
      setForm({
        name: editing.name,
        fatherName: editing.fatherName,
        admissionNo: editing.admissionNo,
        studentCode: editing.studentCode,
        className: editing.className,
        section: editing.section,
        rollNo: "",
        contact: editing.contact,
        address: editing.address ?? "",
        gender: editing.gender ?? "Male",
        monthlyFee: String(editing.monthlyFee),
        admissionDate: editing.admissionDate,
        status: editing.recordStatus,
        notes: editing.notes ?? "",
      });
    } else {
      setForm(emptyForm(sections[0], classes[0]?.name, todayYmd()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  // live duplicate check while typing
  useEffect(() => {
    if (!open || editing) return;
    const needle = form.admissionNo || form.name;
    if (needle.trim().length < 3) {
      setMatch([]);
      return;
    }
    const t = window.setTimeout(async () => {
      setChecking(true);
      try {
        const res = await api<{ students?: { id: number; name: string; admissionNo: string; className: string; fatherName: string }[] }>(
          `/api/students?q=${encodeURIComponent(needle)}`,
          {},
        );
        const list = res.students ?? [];
        setMatch(
          list.filter(
            (s) =>
              (form.admissionNo && s.admissionNo.toLowerCase() === form.admissionNo.toLowerCase()) ||
              (form.name && s.name.toLowerCase() === form.name.toLowerCase()),
          ),
        );
      } catch {
        setMatch([]);
      } finally {
        setChecking(false);
      }
    }, 500);
    return () => window.clearTimeout(t);
  }, [open, editing, form.name, form.admissionNo]);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.name.trim() || !form.fatherName.trim() || !form.admissionNo.trim() || !form.className) {
      toast("Please fill Student Name, Father Name, Admission Number and Class.", "error");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await api(`/api/students/${editing.id}`, {
          method: "PATCH",
          json: { ...form, monthlyFee: Number(form.monthlyFee || 0), photoBase64: picture?.base64, photoName: picture?.fileName, photoType: picture?.contentType },
        });
        toast("Student record updated", "success");
      } else {
        const res = await api<{ duplicate?: boolean; matches?: typeof duplicates; message?: string; student?: { id: number } }>("/api/students", {
          method: "POST",
          json: {
            ...form,
            monthlyFee: Number(form.monthlyFee || 0),
            allowDuplicate: force,
            photoBase64: picture?.base64,
            photoName: picture?.fileName,
            photoType: picture?.contentType,
          },
        });
        if (res.duplicate) {
          setDuplicates(res.matches ?? []);
          toast("Possible duplicate found — please confirm below.", "error");
          setBusy(false);
          return;
        }
        toast(res.message || "Student registered", "success");
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
      title={editing ? `Edit Student — ${editing.name}` : "Register New Student"}
      subtitle={editing ? "Changes apply to the same student record — history is preserved" : "One student, one record — used for all future months"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void save()} loading={busy}>{editing ? "Save Changes" : "Register Student"}</Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Student Name" required>
          <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Ahmad Raza" />
        </Field>
        <Field label="Father / Guardian Name" required>
          <TextInput value={form.fatherName} onChange={(e) => set({ fatherName: e.target.value })} placeholder="e.g. Ali Raza" />
        </Field>
        <Field label="Admission Number" required hint="Unique — used to stop duplicate registration">
          <TextInput value={form.admissionNo} onChange={(e) => set({ admissionNo: e.target.value.toUpperCase() })} placeholder="e.g. ADM-2026-014" />
        </Field>
        <Field label="Student ID" hint="Leave empty to auto-generate">
          <TextInput value={form.studentCode} onChange={(e) => set({ studentCode: e.target.value.toUpperCase() })} placeholder="e.g. IIS-2026-014" />
        </Field>
        <Field label="Class" required>
          <SelectInput
            value={form.className}
            onChange={(e) => {
              const found = classes.find((c) => c.name === e.target.value);
              set({ className: e.target.value, monthlyFee: found ? String(found.defaultFee) : form.monthlyFee });
            }}
          >
            <option value="">Select class…</option>
            {classes.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </SelectInput>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Section">
            <SelectInput value={form.section} onChange={(e) => set({ section: e.target.value })}>
              {sections.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Roll No.">
            <TextInput value={form.rollNo} onChange={(e) => set({ rollNo: e.target.value })} />
          </Field>
        </div>
        <Field label="Monthly Fee" required hint={form.className ? `Default for ${form.className}: ${settings?.feeDefaults.perClass[form.className] ?? 0}` : "Set per class in Settings"}>
          <TextInput inputMode="numeric" value={form.monthlyFee} onChange={(e) => set({ monthlyFee: e.target.value.replace(/[^0-9]/g, "") })} />
        </Field>
        <Field label="Admission Date">
          <TextInput type="date" value={form.admissionDate} onChange={(e) => set({ admissionDate: e.target.value })} />
        </Field>
        <Field label="Contact Number">
          <TextInput value={form.contact} onChange={(e) => set({ contact: e.target.value })} placeholder="+92 300 1234567" />
        </Field>
        <Field label="Gender">
          <SelectInput value={form.gender} onChange={(e) => set({ gender: e.target.value })}>
            <option>Male</option>
            <option>Female</option>
          </SelectInput>
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <TextInput value={form.address} onChange={(e) => set({ address: e.target.value })} />
        </Field>
        {editing ? (
          <Field label="Record Status">
            <SelectInput value={form.status} onChange={(e) => set({ status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Archived / Left school</option>
              <option value="graduated">Passed out</option>
            </SelectInput>
          </Field>
        ) : null}
        <Field label="Notes" className={editing ? "" : "sm:col-span-2"}>
          <TextArea value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="e.g. Brother also studies here, fee discount approved…" />
        </Field>

        <div className="sm:col-span-2">
          <PictureInput
            existingId={editing?.photoId ?? null}
            onChange={setPicture}
            label="Student picture (optional)"
            hint="Shown on the profile, fee cards and printed lists."
          />
        </div>

        {!editing ? (
          <div className="sm:col-span-2">
            <div className={`rounded-xl border px-3 py-2 text-xs ${match.length || duplicates ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10" : "border-ink-200 bg-ink-50 text-ink-500 dark:border-ink-800 dark:bg-ink-800/40"}`}>
              <p className="font-semibold">
                {checking ? "Checking for the same student already registered…" : match.length ? "⚠ Same name or admission number already exists:" : "✓ Duplicate check: no existing student found with this name / admission number."}
              </p>
              {match.map((m) => (
                <p key={m.id} className="mt-1">
                  <Link href={`/students/profile?id=${m.id}`} className="underline" target="_blank">
                    {m.name} · {m.className} · {m.admissionNo}
                  </Link>
                </p>
              ))}
              {duplicates?.map((m) => (
                <p key={`d${m.id}`} className="mt-1">
                  {m.name} · {m.className} · {m.admissionNo}
                </p>
              ))}
              {match.length || duplicates ? (
                <div className="mt-2">
                  <Switch checked={force} onChange={setForce} label="Yes, this is a different student — register anyway" />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function emptyForm(section = "A", className = "", date = todayYmd()): FormState {
  return {
    name: "",
    fatherName: "",
    admissionNo: "",
    studentCode: "",
    className,
    section,
    rollNo: "",
    contact: "",
    address: "",
    gender: "Male",
    monthlyFee: "",
    admissionDate: date,
    status: "active",
    notes: "",
  };
}

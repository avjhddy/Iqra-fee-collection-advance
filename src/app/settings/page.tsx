"use client";

import { useState } from "react";
import { useApp, refreshAll, SETTINGS_EVENT } from "@/components/Providers";
import { api, notifyChange, useJson } from "@/lib/api";
import {
  Badge,
  Button,
  Card,
  Confirm,
  Field,
  Grid,
  KeyValue,
  SectionTitle,
  SelectInput,
  StatCard,
  Switch,
  TextArea,
  TextInput,
} from "@/components/ui";
import { dateLabel } from "@/lib/utils";

type Counts = { students: number; teachers: number; feePayments: number; salaryPayments: number; expenses: number; attachments: number };

export default function SettingsPage() {
  const { settings, saveSettings, toast, theme, toggleTheme } = useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | "clear" | "restore" | "seed">(null);
  const [restorePayload, setRestorePayload] = useState<Record<string, unknown> | null>(null);
  const [restoreInfo, setRestoreInfo] = useState<{ exportedAt?: string; counts?: Record<string, number> } | null>(null);
  const [replaceSeed, setReplaceSeed] = useState(false);

  const [school, setSchool] = useState(settings?.school ?? { name: "", tagline: "", address: "", phone: "", email: "", principal: "", createdBy: "", currency: "PKR", currencySymbol: "Rs." });
  const [fee, setFee] = useState(settings?.feeDefaults ?? { defaultFee: 2000, perClass: {}, dueDay: 10, lateFee: 100 });
  const [salary, setSalary] = useState(settings?.salaryDefaults ?? { defaultSalary: 30000, payDay: 5 });
  const [pdf, setPdf] = useState(settings?.pdf ?? { showCreator: true, showHeader: true, showWatermark: false, showTotals: true, includeAttachments: false, footerText: "", pageSize: "A4", orientation: "portrait" } as NonNullable<typeof settings>["pdf"]);
  const [opening, setOpening] = useState(String(settings?.meta.openingBalance ?? 0));
  const [pageSize, setPageSize] = useState(String(settings?.ui.pageSize ?? 10));
  const [lists, setLists] = useState({
    sections: (settings?.sections ?? []).join(", "),
    subjects: (settings?.subjects ?? []).join(", "),
    expenseCategories: (settings?.expenseCategories ?? []).join(", "),
    paymentMethods: (settings?.paymentMethods ?? []).join(", "),
  });
  const [newClass, setNewClass] = useState({ name: "", fee: String(settings?.feeDefaults.defaultFee ?? 2000) });

  const countsRes = useJson<{ counts: Counts }>("/api/data");
  const counts = countsRes.data?.counts;

  if (!settings) return <Card>Loading settings…</Card>;

  const persist = async (patch: Record<string, unknown>, label: string) => {
    setBusy(label);
    try {
      await saveSettings(patch as never);
      toast(`${label} saved`, "success");
      window.dispatchEvent(new Event(SETTINGS_EVENT));
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };

  const classes = settings.classes ?? [];
  const perClass = { ...(fee.perClass ?? {}) };
  for (const c of classes) if (perClass[c.name] === undefined) perClass[c.name] = c.defaultFee;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Settings</h1>
          <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">School details, fees, salaries, categories, PDF options, backup &amp; restore.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleTheme}>{theme === "dark" ? "☀ Light mode" : "🌙 Dark mode"}</Button>
          <Button variant="soft" size="sm" onClick={() => { refreshAll(); notifyChange("all"); }}>Reload data</Button>
        </div>
      </div>

      <Grid cols={4}>
        <StatCard label="Students" value={counts?.students ?? 0} hint="Registered records" tone="blue" />
        <StatCard label="Teachers" value={counts?.teachers ?? 0} hint="Registered records" tone="violet" />
        <StatCard label="Fee Payments" value={counts?.feePayments ?? 0} hint="Never auto-deleted" tone="green" />
        <StatCard label="Pictures / Receipts" value={counts?.attachments ?? 0} hint="Stored in the database" tone="amber" />
      </Grid>

      {/* school */}
      <Card>
        <SectionTitle title="School Information" subtitle="Shown on the dashboard, all PDFs and receipts" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="School name"><TextInput value={school.name} onChange={(e) => setSchool({ ...school, name: e.target.value })} /></Field>
          <Field label="Tagline"><TextInput value={school.tagline} onChange={(e) => setSchool({ ...school, tagline: e.target.value })} /></Field>
          <Field label="Created-by line"><TextInput value={school.createdBy} onChange={(e) => setSchool({ ...school, createdBy: e.target.value })} /></Field>
          <Field label="Address"><TextInput value={school.address} onChange={(e) => setSchool({ ...school, address: e.target.value })} /></Field>
          <Field label="Phone"><TextInput value={school.phone} onChange={(e) => setSchool({ ...school, phone: e.target.value })} /></Field>
          <Field label="Email"><TextInput value={school.email} onChange={(e) => setSchool({ ...school, email: e.target.value })} /></Field>
          <Field label="Principal / In-charge"><TextInput value={school.principal} onChange={(e) => setSchool({ ...school, principal: e.target.value })} /></Field>
          <Field label="Currency code"><TextInput value={school.currency} onChange={(e) => setSchool({ ...school, currency: e.target.value.toUpperCase().slice(0, 4) })} /></Field>
          <Field label="Currency symbol"><TextInput value={school.currencySymbol} onChange={(e) => setSchool({ ...school, currencySymbol: e.target.value.slice(0, 4) })} /></Field>
        </div>
        <div className="mt-3 flex justify-end">
          <Button loading={busy === "School"} onClick={() => void persist({ school }, "School")}>Save School Details</Button>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* fees */}
        <Card>
          <SectionTitle title="Monthly Fee Settings" subtitle="Auto-fills when you register a student" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Default monthly fee"><TextInput inputMode="numeric" value={String(fee.defaultFee)} onChange={(e) => setFee({ ...fee, defaultFee: Number(e.target.value.replace(/[^0-9]/g, "")) })} /></Field>
            <Field label="Fee due day of month"><TextInput inputMode="numeric" value={String(fee.dueDay)} onChange={(e) => setFee({ ...fee, dueDay: Number(e.target.value.replace(/[^0-9]/g, "")) })} /></Field>
            <Field label="Late fee (optional)" className="col-span-2">
              <TextInput inputMode="numeric" value={String(fee.lateFee)} onChange={(e) => setFee({ ...fee, lateFee: Number(e.target.value.replace(/[^0-9]/g, "")) })} />
            </Field>
          </div>
          <p className="mb-1.5 mt-3 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Fee per class</p>
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {Object.entries(perClass).map(([name, value]) => (
              <div key={name} className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-sm font-semibold">{name}</span>
                <TextInput
                  inputMode="numeric"
                  value={String(value)}
                  onChange={(e) => setFee({ ...fee, perClass: { ...perClass, [name]: Number(e.target.value.replace(/[^0-9]/g, "")) } })}
                />
                <button
                  onClick={() => {
                    const next = { ...perClass };
                    delete next[name];
                    setFee({ ...fee, perClass: next });
                    void persist({ classes: classes.filter((c) => c.name !== name).map((c) => ({ name: c.name, defaultFee: next[c.name] ?? c.defaultFee })), feeDefaults: { ...fee, perClass: next } }, "Class");
                  }}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  title="Remove this class"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-end gap-2 rounded-xl bg-ink-50 p-2 dark:bg-ink-800/50">
            <Field label="New class name" className="flex-1 min-w-[120px]">
              <TextInput value={newClass.name} onChange={(e) => setNewClass({ ...newClass, name: e.target.value })} placeholder="e.g. 8th" />
            </Field>
            <Field label="Default fee" className="w-28">
              <TextInput inputMode="numeric" value={newClass.fee} onChange={(e) => setNewClass({ ...newClass, fee: e.target.value.replace(/[^0-9]/g, "") })} />
            </Field>
            <Button
              onClick={() => {
                if (!newClass.name.trim()) return toast("Type a class name first.", "error");
                const name = newClass.name.trim();
                const feeValue = Number(newClass.fee || 0);
                const nextClasses = [...classes.filter((c) => c.name !== name), { name, defaultFee: feeValue }];
                void persist({ classes: nextClasses, feeDefaults: { ...fee, perClass: { ...perClass, [name]: feeValue } } }, "Class");
                setNewClass({ name: "", fee: String(fee.defaultFee) });
              }}
            >
              ＋ Add class
            </Button>
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="soft" loading={busy === "Fees"} onClick={() => void persist({ feeDefaults: { ...fee, perClass } }, "Fees")}>Save Fee Settings</Button>
          </div>
        </Card>

        {/* salaries + lists */}
        <Card>
          <SectionTitle title="Teacher Salary Settings" subtitle="Defaults used when registering teachers" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Default monthly salary"><TextInput inputMode="numeric" value={String(salary.defaultSalary)} onChange={(e) => setSalary({ ...salary, defaultSalary: Number(e.target.value.replace(/[^0-9]/g, "")) })} /></Field>
            <Field label="Salary pay day"><TextInput inputMode="numeric" value={String(salary.payDay)} onChange={(e) => setSalary({ ...salary, payDay: Number(e.target.value.replace(/[^0-9]/g, "")) })} /></Field>
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="soft" loading={busy === "Salaries"} onClick={() => void persist({ salaryDefaults: salary }, "Salaries")}>Save Salary Settings</Button>
          </div>

          <SectionTitle title="Lists (comma separated)" subtitle="Sections, subjects, expense categories and payment methods" />
          <div className="space-y-2.5">
            {(
              [
                { key: "sections", label: "Sections" },
                { key: "subjects", label: "Subjects" },
                { key: "expenseCategories", label: "Expense categories" },
                { key: "paymentMethods", label: "Payment methods" },
              ] as const
            ).map((row) => (
              <Field key={row.key} label={row.label}>
                <TextArea
                  className="min-h-[52px]"
                  value={lists[row.key]}
                  onChange={(e) => setLists({ ...lists, [row.key]: e.target.value })}
                />
              </Field>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="soft"
              loading={busy === "Lists"}
              onClick={() => {
                const split = (v: string) => v.split(",").map((x) => x.trim()).filter(Boolean);
                void persist(
                  {
                    sections: split(lists.sections),
                    subjects: split(lists.subjects),
                    expenseCategories: split(lists.expenseCategories),
                    paymentMethods: split(lists.paymentMethods),
                  },
                  "Lists",
                );
              }}
            >
              Save Lists
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* pdf */}
        <Card>
          <SectionTitle title="PDF Settings" subtitle="Applied to every report and receipt export" />
          <div className="space-y-2.5">
            <Switch checked={pdf.showHeader} onChange={(v) => setPdf({ ...pdf, showHeader: v })} label="School letterhead on every page" />
            <Switch checked={pdf.showCreator} onChange={(v) => setPdf({ ...pdf, showCreator: v })} label="Show “Created by Mr. AbdulWahid” footer" />
            <Switch checked={pdf.showTotals} onChange={(v) => setPdf({ ...pdf, showTotals: v })} label="Include summary totals" />
            <Switch checked={pdf.showWatermark} onChange={(v) => setPdf({ ...pdf, showWatermark: v })} label="Light watermark" />
            <Switch checked={pdf.includeAttachments} onChange={(v) => setPdf({ ...pdf, includeAttachments: v })} label="Keep receipt pictures with backups / reports" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Page size">
              <SelectInput value={pdf.pageSize} onChange={(e) => setPdf({ ...pdf, pageSize: e.target.value as "A4" | "LETTER" })}>
                <option value="A4">A4</option>
                <option value="LETTER">Letter</option>
              </SelectInput>
            </Field>
            <Field label="Orientation">
              <SelectInput value={pdf.orientation} onChange={(e) => setPdf({ ...pdf, orientation: e.target.value as "portrait" | "landscape" })}>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </SelectInput>
            </Field>
            <Field label="Footer text" className="col-span-2">
              <TextInput value={pdf.footerText} onChange={(e) => setPdf({ ...pdf, footerText: e.target.value })} />
            </Field>
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="soft" loading={busy === "PDF"} onClick={() => void persist({ pdf }, "PDF")}>Save PDF Settings</Button>
          </div>
        </Card>

        {/* data */}
        <Card>
          <SectionTitle title="Backup & Restore" subtitle={`Last backup: ${settings.meta.lastBackupAt ? dateLabel(settings.meta.lastBackupAt.slice(0, 10)) : "never"} · ${settings.meta.backupCount ?? 0} backup(s)`} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Opening fund / previous balance" hint="Added to fees collected when calculating the current balance">
              <TextInput inputMode="numeric" value={opening} onChange={(e) => setOpening(e.target.value.replace(/[^0-9]/g, ""))} />
            </Field>
            <Field label="Rows per table page">
              <SelectInput value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n} rows</option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              loading={busy === "Backup"}
              onClick={async () => {
                setBusy("Backup");
                try {
                  const res = await api<{ backup: Record<string, unknown> }>("/api/data");
                  const blob = new Blob([JSON.stringify(res.backup, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `iqra-backup-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  await persist({ meta: { ...settings.meta, lastBackupAt: new Date().toISOString(), backupCount: Number(settings.meta.backupCount ?? 0) + 1 } }, "Backup stamp");
                  toast("Backup file downloaded", "success");
                } catch (err) {
                  toast((err as Error).message, "error");
                } finally {
                  setBusy(null);
                }
              }}
            >
              ⬇ BACKUP NOW
            </Button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100">
              ⬆ RESTORE BACKUP
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const json = JSON.parse(await file.text()) as Record<string, unknown>;
                    const res = await api<{ preview: { exportedAt: string; counts: Record<string, number> } }>("/api/data", { method: "POST", json: { action: "restore-preview", backup: json } });
                    setRestorePayload(json);
                    setRestoreInfo({ exportedAt: res.preview.exportedAt, counts: res.preview.counts });
                    setConfirm("restore");
                  } catch (err) {
                    toast((err as Error).message, "error");
                  }
                  e.target.value = "";
                }}
              />
            </label>
            <Button variant="outline" onClick={() => setConfirm("seed")}>Load sample school data</Button>
            <Button variant="danger" onClick={() => setConfirm("clear")}>Clear all records</Button>
          </div>

          <div className="mt-3 rounded-xl bg-ink-50 p-3 dark:bg-ink-800/50">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Records stored right now</p>
            <KeyValue
              items={[
                { label: "Students", value: String(counts?.students ?? 0) },
                { label: "Teachers", value: String(counts?.teachers ?? 0) },
                { label: "Fee payments", value: String(counts?.feePayments ?? 0) },
                { label: "Salary payments", value: String(counts?.salaryPayments ?? 0) },
                { label: "Expenses", value: String(counts?.expenses ?? 0) },
                { label: "Pictures", value: String(counts?.attachments ?? 0) },
              ]}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="soft"
              loading={busy === "General"}
              onClick={() =>
                void persist(
                  { meta: { ...settings.meta, openingBalance: Number(opening || 0) }, ui: { ...settings.ui, pageSize: Number(pageSize || 10), theme } },
                  "General",
                )
              }
            >
              Save Balance & Table Options
            </Button>
          </div>
        </Card>
      </div>

      <Confirm
        open={confirm === "clear"}
        title="Clear every record?"
        requireText="CLEAR ALL"
        confirmLabel="Delete all records"
        message="This removes all students, teachers, payments, expenses and pictures from the database. Download a backup first — this cannot be undone."
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          try {
            const res = await api<{ message: string }>("/api/data", { method: "POST", json: { action: "clear", confirm: "CLEAR ALL" } });
            toast(res.message, "info");
            setConfirm(null);
            notifyChange("all");
          } catch (err) {
            toast((err as Error).message, "error");
          }
        }}
      />
      <Confirm
        open={confirm === "seed"}
        title="Load realistic sample school data"
        tone="primary"
        confirmLabel={replaceSeed ? "Replace and load" : "Load sample data"}
        message={
          <div className="space-y-2">
            <p>Creates ~150 students, 9 teachers and 15 months of fee, salary and expense records so you can explore every chart and report.</p>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={replaceSeed} onChange={(e) => setReplaceSeed(e.target.checked)} />
              <span className="text-xs">Replace current data (otherwise this only works on an empty database)</span>
            </label>
          </div>
        }
        onCancel={() => {
          setConfirm(null);
          setReplaceSeed(false);
        }}
        onConfirm={async () => {
          try {
            const res = await api<{ message: string; summary: Record<string, number> }>("/api/data", {
              method: "POST",
              json: { action: "seed", replace: replaceSeed },
            });
            toast(`${res.message}: ${Object.entries(res.summary).map(([k, v]) => `${k} ${v}`).join(", ")}`, "success");
            setConfirm(null);
            setReplaceSeed(false);
            notifyChange("all");
          } catch (err) {
            toast((err as Error).message, "error");
          }
        }}
      />
      <Confirm
        open={confirm === "restore"}
        title="Restore this backup?"
        requireText="RESTORE"
        confirmLabel="Restore backup"
        message={
          <div className="space-y-1.5">
            <p><Badge tone="blue">Backup from</Badge> {restoreInfo?.exportedAt ? dateLabel(restoreInfo.exportedAt.slice(0, 10)) : "unknown"}</p>
            <ul className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(restoreInfo?.counts ?? {}).map(([k, v]) => (
                <li key={k} className="flex justify-between rounded-lg bg-ink-50 px-2 py-1 dark:bg-ink-800/60">
                  <span>{k}</span>
                  <strong>{v}</strong>
                </li>
              ))}
            </ul>
            <p className="text-rose-600">Current records will be replaced by the backup above. Nothing is overwritten silently — this confirmation is required.</p>
          </div>
        }
        onCancel={() => {
          setConfirm(null);
          setRestorePayload(null);
        }}
        onConfirm={async () => {
          if (!restorePayload) return;
          try {
            const res = await api<{ message: string }>("/api/data", { method: "POST", json: { action: "restore", backup: restorePayload, confirm: "RESTORE" } });
            toast(res.message, "success");
            setConfirm(null);
            setRestorePayload(null);
            notifyChange("all");
            window.dispatchEvent(new Event(SETTINGS_EVENT));
          } catch (err) {
            toast((err as Error).message, "error");
          }
        }}
      />
    </div>
  );
}


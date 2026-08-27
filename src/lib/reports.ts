"use client";

import { buildPdf, type PdfTable } from "@/lib/pdf";
import type { Settings } from "@/components/Providers";
import type { ExpenseRow, FeeRow, Overview, SalaryRow, StudentProfile, TeacherProfile, Txn } from "@/lib/viewTypes";
import { dateLabel, formatMoney, ymLabel } from "@/lib/utils";

const sym = (s: Settings | null) => s?.school.currencySymbol ?? "Rs.";
const money = (n: number, s: Settings | null) => formatMoney(Number(n ?? 0), sym(s));

function stamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function downloadMonthlyFinancialReport(ov: Overview, settings: Settings | null) {
  const s = ov.summary;
  const k = ov.kpis;
  const tables: PdfTable[] = [
    {
      title: "A · Student Fees",
      head: ["Item", "Amount / Count"],
      align: ["left", "right"],
      body: [
        ["Total fee expected for the month", money(s.expectedFees, settings)],
        ["Total fees collected", money(s.collectedFees, settings)],
        ["Fees remaining (incl. old dues)", money(s.feesRemaining, settings)],
        ["Collection rate", `${s.collectionRate}%`],
        ["Students paid", String(s.studentsPaid)],
        ["Students partially paid", String(s.studentsPartial)],
        ["Students not paid", String(s.studentsUnpaid)],
      ],
    },
    {
      title: "B · Teacher Salaries",
      head: ["Item", "Amount / Count"],
      align: ["left", "right"],
      body: [
        ["Total salary to pay (incl. previous due)", money(s.salaryTotal, settings)],
        ["Salaries paid", money(s.salaryPaid, settings)],
        ["Salaries remaining", money(s.salariesRemaining, settings)],
        ["Teachers on record", String(k.totalTeachers)],
      ],
    },
    {
      title: "C · Other Expenses",
      head: ["Item", "Amount / Count"],
      align: ["left", "right"],
      body: [
        ["Other expenses paid", money(s.expenseTotal, settings)],
        ...ov.categories.map((c) => [`   · ${c.name}`, money(c.value, settings)]),
      ],
    },
    {
      title: "D · School Money Flow",
      head: ["Item", "Amount"],
      align: ["left", "right"],
      body: [
        ["Opening fund / previous balance", money(k.openingBalance, settings)],
        ["Less: teacher salaries paid (all time)", `- ${money(k.salariesAllTime, settings)}`],
        ["Less: other expenses (all time)", `- ${money(k.expensesAllTime, settings)}`],
        ["Plus: fees collected (all time)", money(k.feesCollectedAllTime, settings)],
        ["CURRENT BALANCE", money(k.currentBalance, settings)],
      ],
    },
    {
      title: "E · Month by Month (last 13 months)",
      head: ["Month", "Fees Collected", "Salaries Paid", "Expenses", "Net", "Balance"],
      align: ["left", "right", "right", "right", "right", "right"],
      body: ov.series.map((r) => [
        ymLabel(r.ym),
        money(r.collected, settings),
        money(r.salaries, settings),
        money(r.expenses, settings),
        money(r.net, settings),
        money(r.balance, settings),
      ]),
    },
  ];
  return buildPdf({
    settings,
    title: "Monthly Financial Report",
    subtitle: `${ov.period.label}  ·  Period: ${dateLabel(ov.period.from)} to ${dateLabel(ov.period.to)}`,
    meta: [
      { label: "Students", value: String(k.totalStudents) },
      { label: "Teachers", value: String(k.totalTeachers) },
      { label: "Balance", value: money(k.currentBalance, settings) },
      { label: "Fees Remaining", value: money(k.feesRemaining, settings) },
      { label: "Salaries Remaining", value: money(k.salariesRemaining, settings) },
      { label: "Generated", value: dateLabel(stamp()) },
    ],
    tables,
    filename: `monthly-report-${ov.period.ym}.pdf`,
  });
}

export async function downloadFeeSheetReport(
  rows: FeeRow[],
  opts: { settings: Settings | null; month: string; title?: string; note?: string; onlyUnpaid?: boolean },
) {
  const paid = rows.filter((r) => r.status === "paid").length;
  const head = ["#", "Student ID", "Student Name", "Father Name", "Class", "Monthly Fee", "Prev. Due", "Paid", "Remaining", "Status", "Last Payment"];
  const body = rows.map((r, i) => [
    i + 1,
    r.studentCode,
    r.name,
    r.fatherName,
    `${r.className}-${r.section}`,
    money(r.monthlyFee, opts.settings),
    money(r.prevDue, opts.settings),
    money(r.paid, opts.settings),
    money(r.remaining, opts.settings),
    r.status === "paid" ? "Paid" : r.status === "partial" ? "Partial" : "Not Paid",
    r.lastPaymentDate ? dateLabel(r.lastPaymentDate) : "—",
  ]);
  return buildPdf({
    settings: opts.settings,
    title: opts.title ?? (opts.onlyUnpaid ? "Fee Pending List (Students Who Have Not Paid)" : "Monthly Student Fee Report"),
    subtitle: `${ymLabel(opts.month)}  ·  ${rows.length} student${rows.length === 1 ? "" : "s"}  ·  Paid: ${paid}`,
    meta: [
      { label: "Expected", value: money(rows.reduce((s, r) => s + r.expected, 0), opts.settings) },
      { label: "Collected", value: money(rows.reduce((s, r) => s + r.paid, 0), opts.settings) },
      { label: "Remaining", value: money(rows.reduce((s, r) => s + r.remaining, 0), opts.settings) },
    ],
    tables: [{ head, body, align: ["right", "left", "left", "left", "left", "right", "right", "right", "right", "center", "left"], note: opts.note }],
    filename: `fee-report-${opts.month}${opts.onlyUnpaid ? "-pending" : ""}.pdf`,
    landscape: true,
  });
}

export async function downloadSalaryReport(rows: SalaryRow[], opts: { settings: Settings | null; month: string; title?: string }) {
  const head = ["#", "Teacher ID", "Teacher Name", "Subject", "Monthly Salary", "Prev. Due", "Paid", "Remaining", "Status", "Paid On"];
  const body = rows.map((r, i) => [
    i + 1,
    r.teacherCode,
    r.name,
    r.subject,
    money(r.monthlySalary, opts.settings),
    money(r.prevDue, opts.settings),
    money(r.paid, opts.settings),
    money(r.remaining, opts.settings),
    r.status === "paid" ? "Paid" : r.status === "partial" ? "Partial" : "Not Paid",
    r.lastPaymentDate ? dateLabel(r.lastPaymentDate) : "—",
  ]);
  return buildPdf({
    settings: opts.settings,
    title: opts.title ?? "Teacher Salary Report",
    subtitle: `${ymLabel(opts.month)}  ·  ${rows.length} teacher${rows.length === 1 ? "" : "s"}`,
    meta: [
      { label: "To Pay", value: money(rows.reduce((s, r) => s + r.expected, 0), opts.settings) },
      { label: "Paid", value: money(rows.reduce((s, r) => s + r.paid, 0), opts.settings) },
      { label: "Remaining", value: money(rows.reduce((s, r) => s + r.remaining, 0), opts.settings) },
    ],
    tables: [{ head, body, align: ["right", "left", "left", "left", "right", "right", "right", "right", "center", "left"] }],
    filename: `salary-report-${opts.month}.pdf`,
    landscape: true,
  });
}

export async function downloadExpenseReport(rows: ExpenseRow[], opts: { settings: Settings | null; from: string; to: string; title?: string }) {
  const byCat = new Map<string, number>();
  rows.forEach((r) => byCat.set(r.category, (byCat.get(r.category) ?? 0) + r.amount));
  const head = ["#", "Date", "Category", "Description", "Paid To", "Method", "Amount", "Remarks"];
  const body = rows.map((r, i) => [
    i + 1,
    dateLabel(r.expenseDate),
    r.category,
    r.title,
    r.paidTo || "—",
    r.method,
    money(r.amount, opts.settings),
    r.remarks || "",
  ]);
  return buildPdf({
    settings: opts.settings,
    title: opts.title ?? "Other Expenses Report",
    subtitle: `${dateLabel(opts.from)} to ${dateLabel(opts.to)}  ·  ${rows.length} record${rows.length === 1 ? "" : "s"}`,
    meta: [{ label: "Total Expenses", value: money(rows.reduce((s, r) => s + r.amount, 0), opts.settings) }],
    tables: [
      { head, body, align: ["right", "left", "left", "left", "left", "left", "right", "left"] },
      {
        title: "Category Summary",
        head: ["Category", "Amount", "% of Total"],
        align: ["left", "right", "right"],
        body: [...byCat.entries()].map(([name, value]) => [name, money(value, opts.settings), `${Math.round((value / Math.max(1, rows.reduce((s, r) => s + r.amount, 0))) * 100)}%`]),
      },
    ],
    filename: `expenses-${opts.from}-to-${opts.to}.pdf`,
    landscape: true,
  });
}

export async function downloadTransactionsReport(rows: Txn[], opts: { settings: Settings | null; from: string; to: string; title?: string; balance?: number }) {
  const head = ["Date", "Type", "Student / Teacher / Vendor", "Detail", "Receipt / Ref", "Method", "IN (Fees)", "OUT (Spending)", "Remarks"];
  const body = rows.map((r) => [
    dateLabel(r.date),
    r.type === "fee" ? "Fee Collection" : r.type === "salary" ? "Teacher Salary" : r.category,
    r.person,
    r.detail,
    r.docNo,
    r.method,
    r.direction === "in" ? money(r.amount, opts.settings) : "",
    r.direction === "out" ? money(r.amount, opts.settings) : "",
    r.remarks || "",
  ]);
  const ins = rows.filter((r) => r.direction === "in").reduce((s, r) => s + r.amount, 0);
  const outs = rows.filter((r) => r.direction === "out").reduce((s, r) => s + r.amount, 0);
  return buildPdf({
    settings: opts.settings,
    title: opts.title ?? "Custom Date-to-Date Financial Report",
    subtitle: `${dateLabel(opts.from)} to ${dateLabel(opts.to)}  ·  ${rows.length} transactions`,
    meta: [
      { label: "Fees Collected", value: money(ins, opts.settings) },
      { label: "Total Spent", value: money(outs, opts.settings) },
      { label: "Net", value: money(ins - outs, opts.settings) },
      { label: "Balance", value: opts.balance !== undefined ? money(opts.balance, opts.settings) : "—" },
      { label: "Records", value: String(rows.length) },
      { label: "Generated", value: dateLabel(stamp()) },
    ],
    tables: [{ head, body, align: ["left", "left", "left", "left", "left", "left", "right", "right", "left"], note: `Grand totals — Money IN ${money(ins, opts.settings)} · Money OUT ${money(outs, opts.settings)}` }],
    filename: `report-${opts.from}-to-${opts.to}.pdf`,
    landscape: true,
  });
}

export async function downloadStudentHistory(profile: StudentProfile, settings: Settings | null) {
  const s = profile.student;
  return buildPdf({
    settings,
    title: "Student Fee History",
    subtitle: `${s.name} · ${s.className}-${s.section} · ${s.studentCode}`,
    meta: [
      { label: "Father / Guardian", value: s.fatherName },
      { label: "Admission No.", value: s.admissionNo },
      { label: "Contact", value: s.contact || "—" },
      { label: "Monthly Fee", value: money(s.monthlyFee, settings) },
      { label: "Total Paid", value: money(profile.totals.paid, settings) },
      { label: "Remaining", value: money(profile.totals.due, settings) },
    ],
    tables: [
      {
        title: "Month by Month",
        head: ["Month", "Fee", "Paid", "Remaining", "Status"],
        align: ["left", "right", "right", "right", "center"],
        body: profile.history.map((h) => [h.label, money(h.expected, settings), money(h.paid, settings), money(h.remaining, settings), h.status]),
      },
      {
        title: "Payment Records",
        head: ["Date", "Receipt No.", "For Month", "Amount", "Method", "Remarks"],
        align: ["left", "left", "left", "right", "left", "left"],
        body: profile.payments.map((p) => [
          dateLabel(p.paymentDate),
          p.receiptNo,
          ymLabel(p.feeMonth),
          money(p.amount, settings),
          p.method,
          `${p.remarks ?? ""}${p.voided ? " (VOID)" : ""}`,
        ]),
      },
    ],
    filename: `student-${s.studentCode}-history.pdf`,
  });
}

export async function downloadTeacherHistory(profile: TeacherProfile, settings: Settings | null) {
  const t = profile.teacher;
  return buildPdf({
    settings,
    title: "Teacher Salary History",
    subtitle: `${t.name} · ${t.subject} · ${t.teacherCode}`,
    meta: [
      { label: "Monthly Salary", value: money(t.monthlySalary, settings) },
      { label: "Joining Date", value: dateLabel(t.joiningDate) },
      { label: "Contact", value: t.contact || "—" },
      { label: "Total Paid", value: money(profile.totals.paid, settings) },
      { label: "Salary Remaining", value: money(profile.totals.due, settings) },
    ],
    tables: [
      {
        title: "Salary Payments",
        head: ["Date", "Reference", "For Month", "Amount", "Method", "Remarks"],
        align: ["left", "left", "left", "right", "left", "left"],
        body: profile.payments.map((p) => [
          dateLabel(p.paymentDate),
          p.referenceNo,
          ymLabel(p.salaryMonth),
          money(p.amount, settings),
          p.method,
          `${p.remarks ?? ""}${p.voided ? " (VOID)" : ""}`,
        ]),
      },
    ],
    filename: `teacher-${t.teacherCode}-salary.pdf`,
  });
}

/** Shared view-model types (mirrors the API payloads without importing server code). */

export type FeeRow = {
  id: number;
  studentCode: string;
  admissionNo: string;
  name: string;
  fatherName: string;
  className: string;
  section: string;
  contact: string;
  monthlyFee: number;
  billedMonths: number;
  prevDue: number;
  expected: number;
  paid: number;
  remaining: number;
  credit: number;
  totalPaid: number;
  totalDue: number;
  status: "paid" | "partial" | "unpaid";
  lastPaymentDate: string | null;
  photoId: number | null;
  admissionDate: string;
  recordStatus: string;
  notes: string;
  gender: string;
  address: string;
};

export type SalaryRow = {
  id: number;
  teacherCode: string;
  name: string;
  subject: string;
  qualification?: string;
  notes?: string;
  contact: string;
  monthlySalary: number;
  billedMonths: number;
  prevDue: number;
  expected: number;
  paid: number;
  remaining: number;
  totalPaid: number;
  totalDue: number;
  status: "paid" | "partial" | "unpaid";
  lastPaymentDate: string | null;
  photoId: number | null;
  joiningDate: string;
  recordStatus: string;
};

export type Txn = {
  type: "fee" | "salary" | "expense";
  id: number;
  date: string;
  person: string;
  detail: string;
  category: string;
  docNo: string;
  amount: number;
  direction: "in" | "out";
  remarks: string;
  method: string;
  attachmentId: number | null;
  voided: boolean;
  month: string;
};

export type PaymentRow = {
  id: number;
  studentId?: number;
  teacherId?: number;
  studentName?: string;
  teacherName?: string;
  name?: string;
  fatherName?: string;
  contact?: string;
  className?: string;
  subject?: string;
  section?: string;
  monthlyFee?: number;
  monthlySalary?: number;
  admissionNo?: string;
  studentCode?: string;
  teacherCode?: string;
  feeMonth?: string;
  salaryMonth?: string;
  amount: number;
  paymentDate: string;
  method: string;
  receiptNo?: string;
  referenceNo?: string;
  remarks: string;
  attachmentId: number | null;
  voided: boolean;
};

export type ExpenseRow = {
  id: number;
  category: string;
  title: string;
  amount: number;
  expenseDate: string;
  paidTo: string;
  method: string;
  remarks: string;
  attachmentId: number | null;
  voided: boolean;
  docNo: string;
};

export type Overview = {
  period: { ym: string; from: string; to: string; prevFrom: string; prevTo: string; label: string; days: number };
  currency: string;
  school: { name: string; tagline: string; createdBy: string; [k: string]: string };
  kpis: {
    currentBalance: number;
    balanceAllTime: number;
    openingBalance: number;
    collectedPeriod: number;
    salariesPeriod: number;
    expensesPeriod: number;
    netPeriod: number;
    feesCollectedAllTime: number;
    salariesAllTime: number;
    expensesAllTime: number;
    feesRemaining: number;
    salariesRemaining: number;
    expectedFees: number;
    collectedFees: number;
    totalStudents: number;
    totalTeachers: number;
    paidCount: number;
    partialCount: number;
    unpaidCount: number;
    feeTxCount: number;
    salaryTxCount: number;
    expenseTxCount: number;
    trends: {
      collected: { pct: number; dir: string; diff: number };
      salaries: { pct: number; dir: string; diff: number };
      expenses: { pct: number; dir: string; diff: number };
      balance: { pct: number; dir: string; diff: number };
    };
  };
  summary: {
    ym: string;
    label: string;
    expectedFees: number;
    collectedFees: number;
    feesRemaining: number;
    studentsPaid: number;
    studentsPartial: number;
    studentsUnpaid: number;
    salaryTotal: number;
    salaryPaid: number;
    salariesRemaining: number;
    expenseTotal: number;
    balance: number;
    collectionRate: number;
  };
  flow: { opening: number; in: number; salaries: number; expenses: number; balance: number };
  series: { ym: string; label: string; collected: number; salaries: number; expenses: number; net: number; balance: number }[];
  categories: { name: string; value: number; count: number }[];
  classBars: { name: string; expected: number; collected: number; students: number; unpaid: number }[];
  statusSplit: { name: string; value: number; color: string }[];
  unpaidStudents: FeeRow[];
  unpaidTeachers: SalaryRow[];
  recentPayments: PaymentRow[];
  recentSalaries: PaymentRow[];
  recentExpenses: ExpenseRow[];
};

export type StudentProfile = {
  student: {
    id: number;
    studentCode: string;
    admissionNo: string;
    name: string;
    fatherName: string;
    className: string;
    section: string;
    rollNo: string;
    contact: string;
    address: string;
    gender: string;
    birthDate: string | null;
    monthlyFee: number;
    admissionDate: string;
    status: string;
    notes: string;
    photoId: number | null;
  };
  totals: { billed: number; paid: number; due: number; credit: number; monthsBilled: number; lastPaymentDate: string | null };
  history: { ym: string; label: string; expected: number; paid: number; remaining: number; status: string }[];
  payments: {
    id: number;
    amount: number;
    feeMonth: string;
    paymentDate: string;
    method: string;
    receiptNo: string;
    remarks: string;
    attachmentId: number | null;
    voided: boolean;
  }[];
};

export type TeacherProfile = {
  teacher: {
    id: number;
    teacherCode: string;
    name: string;
    subject: string;
    qualification: string;
    contact: string;
    joiningDate: string;
    monthlySalary: number;
    status: string;
    notes: string;
    photoId: number | null;
  };
  totals: { billed: number; paid: number; due: number; monthsBilled: number; lastPaymentDate: string | null };
  payments: {
    id: number;
    amount: number;
    salaryMonth: string;
    paymentDate: string;
    method: string;
    referenceNo: string;
    remarks: string;
    attachmentId: number | null;
    voided: boolean;
  }[];
};

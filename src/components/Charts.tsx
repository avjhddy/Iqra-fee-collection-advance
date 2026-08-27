"use client";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatShortMoney } from "@/lib/utils";

export const CHART_COLORS = ["#10b188", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#6366f1", "#84cc16", "#e11d48"];

/* eslint-disable @typescript-eslint/no-explicit-any */
function TooltipBox({ active, payload, label, symbol }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card animate-pop px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-ink-800 dark:text-ink-100">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey ?? p.name} className="flex items-center gap-2 tabular-nums text-ink-600 dark:text-ink-300">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color ?? p.payload?.fill }} />
          <span className="min-w-[92px]">{p.name}</span>
          <strong className="text-ink-900 dark:text-white">{formatShortMoney(Number(p.value), symbol)}</strong>
        </p>
      ))}
    </div>
  );
}

const axisProps = {
  stroke: "currentColor",
  tick: { fill: "#8b9cb2", fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: "#d9e1eb" },
};

export function MoneyTrendChart({
  data,
  symbol,
  height = 260,
}: {
  data: { label: string; collected: number; salaries: number; expenses: number; net: number }[];
  symbol?: string;
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full text-ink-400">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 10, left: -14, bottom: 0 }} barGap={2}>
          <defs>
            <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b188" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#10b188" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="currentColor" strokeOpacity={0.35} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} tickFormatter={(v: number) => formatShortMoney(v, symbol).replace(symbol ?? "Rs.", "").trim()} width={54} />
          <Tooltip content={<TooltipBox symbol={symbol} />} cursor={{ fill: "rgba(16,177,136,0.06)" }} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} iconType="circle" iconSize={8} />
          <Bar dataKey="collected" name="Fees Collected" fill="#10b188" radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="salaries" name="Salaries Paid" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Line type="monotone" dataKey="expenses" name="Other Expenses" stroke="#f59e0b" strokeWidth={2.2} dot={{ r: 2.4 }} activeDot={{ r: 5 }} />
          <Area type="monotone" dataKey="net" name="Net Saved" stroke="#058e71" strokeWidth={2} fill="url(#gNet)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BalanceAreaChart({
  data,
  symbol,
  height = 210,
}: {
  data: { label: string; balance: number }[];
  symbol?: string;
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full text-ink-400">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChartish data={data} symbol={symbol} />
      </ResponsiveContainer>
    </div>
  );
}

function AreaChartish({ data, symbol }: { data: { label: string; balance: number }[]; symbol?: string }) {
  return (
    <ComposedChart data={data} margin={{ top: 8, right: 10, left: -16, bottom: 0 }}>
      <defs>
        <linearGradient id="gBalance" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.03} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="currentColor" strokeOpacity={0.35} />
      <XAxis dataKey="label" {...axisProps} />
      <YAxis {...axisProps} tickFormatter={(v: number) => formatShortMoney(v, symbol).replace(symbol ?? "Rs.", "").trim()} width={56} />
      <Tooltip content={<TooltipBox symbol={symbol} />} />
      <Area type="monotone" dataKey="balance" name="School Balance" stroke="#0284c7" strokeWidth={2.4} fill="url(#gBalance)" />
    </ComposedChart>
  );
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  symbol,
  height = 230,
  colors,
  formatter,
}: {
  data: { name: string; value: number }[];
  centerLabel?: string;
  centerValue?: string;
  symbol?: string;
  height?: number;
  colors?: string[];
  formatter?: (value: number, name: string) => string;
}) {
  const palette = colors ?? CHART_COLORS;
  const total = data.reduce((s, d) => s + Number(d.value || 0), 0);
  const rows = data.filter((d) => Number(d.value) > 0);
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,170px)]">
      <div style={{ height }} className="relative text-ink-400">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows.length ? rows : [{ name: "No data", value: 1 }]}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="86%"
              paddingAngle={rows.length > 1 ? 2 : 0}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {(rows.length ? rows : [{ name: "No data", value: 1 }]).map((_, i) => (
                <Cell key={i} fill={rows.length ? palette[i % palette.length] : "#d9e1eb"} />
              ))}
            </Pie>
            <Tooltip content={<TooltipBox symbol={symbol} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">{centerLabel}</p>
          <p className="text-base font-bold text-ink-900 dark:text-white">{centerValue}</p>
        </div>
      </div>
      <ul className="space-y-1.5 self-center">
        {rows.length ? (
          rows.map((d, i) => (
            <li key={d.name} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: palette[i % palette.length] }} />
                <span className="truncate text-ink-600 dark:text-ink-300">{d.name}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-ink-800 dark:text-ink-100">
                {formatter ? formatter(d.value, d.name) : `${Math.round((d.value / (total || 1)) * 100)}%`}
              </span>
            </li>
          ))
        ) : (
          <li className="text-xs text-ink-500">Nothing in this period</li>
        )}
      </ul>
    </div>
  );
}

export function ClassBarChart({
  data,
  symbol,
  height = 260,
}: {
  data: { name: string; expected: number; collected: number }[];
  symbol?: string;
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full text-ink-400">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 10, left: -14, bottom: 0 }} barGap={3}>
          <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="currentColor" strokeOpacity={0.35} />
          <XAxis dataKey="name" {...axisProps} interval={0} tick={{ fill: "#8b9cb2", fontSize: 10 }} />
          <YAxis {...axisProps} tickFormatter={(v: number) => formatShortMoney(v, symbol).replace(symbol ?? "Rs.", "").trim()} width={54} />
          <Tooltip content={<TooltipBox symbol={symbol} />} cursor={{ fill: "rgba(14,165,233,0.07)" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
          <Bar dataKey="expected" name="Fee Expected" fill="#b6c3d3" radius={[4, 4, 0, 0]} maxBarSize={20} />
          <Bar dataKey="collected" name="Collected" fill="#10b188" radius={[4, 4, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleLineChart({
  data,
  lines,
  symbol,
  height = 200,
}: {
  data: Record<string, string | number>[];
  lines: { key: string; name: string; color: string }[];
  symbol?: string;
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full text-ink-400">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="currentColor" strokeOpacity={0.35} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} tickFormatter={(v: number) => formatShortMoney(v, symbol).replace(symbol ?? "Rs.", "").trim()} width={54} />
          <Tooltip content={<TooltipBox symbol={symbol} />} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
          {lines.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.name}
              stroke={l.color}
              strokeWidth={2.3}
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
              animationDuration={600}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MiniSparkline({ values, color = "#10b188" }: { values: number[]; color?: string }) {
  const data = values.map((v, i) => ({ i, v }));
  return (
    <div style={{ height: 34 }} className="w-full text-transparent">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.6} fill={color} fillOpacity={0.16} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}



"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useTheme } from "@/components/layout/ThemeProvider";

interface TrendChartProps {
  title: string;
  data: { date: string; value: number }[];
  color?: string;
  height?: number;
  /** Pass a string format key instead of a function so server components can use it.
   *  "currency" → $XXK, "number" → toLocaleString(), "decimal1" → 1 decimal place
   *  Or pass a function directly (only from client components). */
  valueFormatter?: ((value: number) => string) | "currency" | "number" | "decimal1";
}

const FORMAT_MAP: Record<string, (v: number) => string> = {
  currency: (v) => `$${Math.round(v / 1000)}K`,
  number: (v) => v.toLocaleString(),
  decimal1: (v) => v.toFixed(1),
};

export function TrendChart({
  title,
  data,
  color = "#3b82f6",
  height = 200,
  valueFormatter = "number",
}: TrendChartProps) {
  const fmt =
    typeof valueFormatter === "string"
      ? FORMAT_MAP[valueFormatter] ?? ((v: number) => v.toLocaleString())
      : valueFormatter;
  const { theme } = useTheme();

  const gridColor = theme === "dark" ? "#262626" : "#e5e0d9";
  const tickColor = theme === "dark" ? "#a3a3a3" : "#6b6b6b";
  const tooltipBg = theme === "dark" ? "#1a1a1a" : "#ffffff";
  const tooltipBorder = theme === "dark" ? "#262626" : "#e5e0d9";
  const tooltipText = theme === "dark" ? "#fafafa" : "#1a1a1a";

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="date"
            tick={{ fill: tickColor, fontSize: 12 }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: tickColor, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmt}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: "8px",
              color: tooltipText,
              fontSize: "13px",
            }}
            formatter={(value: unknown) => [fmt(typeof value === "number" ? value : 0), title]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${title})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

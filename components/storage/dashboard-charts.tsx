
// @/components/storage/dashboard-charts.tsx
"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const CHART_SHADES = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

interface DashboardChartsProps {
  breakdown: Array<{ category: string; size: number }>;
}

export function DashboardCharts({ breakdown }: DashboardChartsProps) {
  if (breakdown.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No data yet
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={breakdown}
        layout="vertical"
        margin={{ left: 8, right: 16 }}
      >
        <XAxis type="number" hide domain={[0, "dataMax"]} />
        <YAxis
          type="category"
          dataKey="category"
          width={72}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          tickFormatter={(v: string) =>
            v.charAt(0).toUpperCase() + v.slice(1)
          }
        />
        <Bar dataKey="size" radius={[0, 4, 4, 0]} barSize={20}>
          {breakdown.map((_, i) => (
            <Cell
              key={i}
              fill={CHART_SHADES[i % CHART_SHADES.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
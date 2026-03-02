"use client";

import { useEffect, useState } from "react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { DataTable } from "@/components/dashboard/DataTable";
import { ShieldAlert } from "lucide-react";

interface CrimeData {
  years: number[];
  series: Record<string, number[]>;
  latestYear: number;
  latestTotal: number;
  latestRate: number;
  yearOverYearChange: number;
  breakdown: { offenceType: string; incidents: number; ratePer100k: number; percentChange: number }[];
}

export default function CrimePage() {
  const [data, setData] = useState<CrimeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/data/crime")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Crime & Safety</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Loading crime data...</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Latest Crime Rate /100k",
      value: data?.latestRate?.toLocaleString() ?? "—",
      change: data?.yearOverYearChange,
      changeLabel: "vs prior year",
      trend: (data?.yearOverYearChange ?? 0) < 0 ? ("down" as const) : ("up" as const),
    },
    {
      label: "Total Incidents",
      value: data?.latestTotal?.toLocaleString() ?? "—",
      trend: "flat" as const,
    },
    {
      label: "Latest Year",
      value: data?.latestYear?.toString() ?? "—",
      trend: "flat" as const,
    },
    {
      label: "Categories Tracked",
      value: data?.breakdown?.length?.toString() ?? "—",
      trend: "flat" as const,
    },
  ];

  // Build trend data for chart
  const trendData =
    data?.years?.map((year, i) => ({
      date: year.toString(),
      value: data.series?.["Total CSI"]?.[i] ?? data.series?.["Total property crime"]?.[i] ?? 0,
    })) ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-red-500/10">
          <ShieldAlert size={24} className="text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Crime & Safety</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Police-reported crime statistics for Kelowna from Statistics Canada
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <TrendChart
          title="Crime Severity Index / Total Crime Rate"
          data={trendData}
          color="#ef4444"
          height={280}
        />
      )}

      {/* Multi-series comparison */}
      {data?.series && Object.keys(data.series).length > 1 && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Crime by Category (Incidents)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)]">
                  <th className="text-left text-xs text-[var(--text-secondary)] py-2 pr-4">Category</th>
                  {data.years.map((y) => (
                    <th key={y} className="text-right text-xs text-[var(--text-secondary)] py-2 px-2">{y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.series).map(([category, values]) => (
                  <tr key={category} className="border-b border-[var(--card-border)] last:border-0">
                    <td className="py-2 pr-4 text-[var(--text-primary)]">{category}</td>
                    {values.map((v, i) => (
                      <td key={i} className="text-right py-2 px-2 text-[var(--text-secondary)]">
                        {v.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Breakdown Table */}
      {data?.breakdown && data.breakdown.length > 0 && (
        <DataTable
          title={`Crime Breakdown — ${data.latestYear}`}
          columns={[
            { key: "offenceType" as keyof typeof data.breakdown[0], label: "Offence Type" },
            {
              key: "incidents" as keyof typeof data.breakdown[0],
              label: "Incidents",
              render: (v) => Number(v).toLocaleString(),
            },
            {
              key: "ratePer100k" as keyof typeof data.breakdown[0],
              label: "Rate /100k",
              render: (v) => Number(v).toFixed(1),
            },
            {
              key: "percentChange" as keyof typeof data.breakdown[0],
              label: "% Change",
              render: (v) => {
                const n = Number(v);
                const color = n < 0 ? "text-emerald-500" : n > 0 ? "text-red-500" : "text-[var(--text-secondary)]";
                return <span className={color}>{n >= 0 ? "+" : ""}{n.toFixed(1)}%</span>;
              },
            },
          ]}
          data={data.breakdown as unknown as Record<string, unknown>[]}
          emptyMessage="No crime data yet. Run: /api/etl/crime"
        />
      )}

      {/* Context */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">About This Data</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Crime statistics are sourced from Statistics Canada (Table 35-10-0018-01) and reflect
          police-reported incidents for the Kelowna Municipal RCMP jurisdiction. Data is updated
          annually, typically in July/August. The Crime Severity Index (CSI) weights offences by
          seriousness — a higher CSI indicates more serious crime patterns.
        </p>
      </div>
    </div>
  );
}

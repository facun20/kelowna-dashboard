"use client";

import { useEffect, useState } from "react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { Home } from "lucide-react";

interface HousingData {
  years: string[];
  starts: number[];
  completions: number[];
  avgPrices: number[];
  latestStarts: number;
  latestPrice: number;
  startsChange: number;
  priceChange: number;
}

export default function HousingPage() {
  const [data, setData] = useState<HousingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/data/housing")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Housing Development</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Loading housing data...</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Compute additional KPIs from the data
  const totalStarts = data?.starts?.reduce((s, v) => s + v, 0) ?? 0;
  const totalCompletions = data?.completions?.reduce((s, v) => s + v, 0) ?? 0;
  const latestCompletions = data?.completions?.[data.completions.length - 1] ?? 0;
  const priorCompletions = data?.completions?.[data.completions.length - 2] ?? 0;
  const completionsChange = priorCompletions > 0
    ? Math.round(((latestCompletions - priorCompletions) / priorCompletions) * 1000) / 10
    : 0;

  const kpis = [
    {
      label: "Housing Starts (Latest)",
      value: data?.latestStarts?.toLocaleString() ?? "—",
      change: data?.startsChange,
      changeLabel: "vs prior year",
      trend: (data?.startsChange ?? 0) > 0 ? ("up" as const) : ("down" as const),
    },
    {
      label: "Completions (Latest)",
      value: latestCompletions.toLocaleString(),
      change: completionsChange || undefined,
      changeLabel: "vs prior year",
      trend: completionsChange > 0 ? ("up" as const) : completionsChange < 0 ? ("down" as const) : ("flat" as const),
    },
    {
      label: "Avg Home Price",
      value: data?.latestPrice ? `$${(data.latestPrice / 1000).toFixed(0)}K` : "—",
      change: data?.priceChange,
      changeLabel: "vs prior year",
      trend: (data?.priceChange ?? 0) > 0 ? ("up" as const) : ("down" as const),
    },
    {
      label: "Total Starts (All Years)",
      value: totalStarts.toLocaleString(),
      trend: "flat" as const,
    },
  ];

  const startsTrend =
    data?.years?.map((y, i) => ({ date: y, value: data.starts[i] ?? 0 })) ?? [];

  const completionsTrend =
    data?.years?.map((y, i) => ({ date: y, value: data.completions[i] ?? 0 })) ?? [];

  const priceTrend =
    data?.years?.map((y, i) => ({ date: y, value: data.avgPrices[i] ?? 0 })) ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-500/10">
          <Home size={24} className="text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Housing Development</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            CMHC housing starts, completions, and price trends for the Kelowna CMA
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {startsTrend.length > 0 && (
          <TrendChart
            title="Housing Starts by Year"
            data={startsTrend}
            color="#22c55e"
            height={260}
          />
        )}
        {completionsTrend.length > 0 && (
          <TrendChart
            title="Completions by Year"
            data={completionsTrend}
            color="#3b82f6"
            height={260}
          />
        )}
      </div>

      {/* Price trend — full width */}
      {priceTrend.length > 0 && (
        <TrendChart
          title="Average Home Price by Year (CMHC)"
          data={priceTrend}
          color="#8b5cf6"
          height={260}
          valueFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
        />
      )}

      {/* Year-by-year table */}
      {data?.years && data.years.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Housing Data by Year</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)]">
                  <th className="text-left text-xs text-[var(--text-secondary)] py-2 pr-4">Year</th>
                  <th className="text-right text-xs text-[var(--text-secondary)] py-2 px-3">Starts</th>
                  <th className="text-right text-xs text-[var(--text-secondary)] py-2 px-3">Completions</th>
                  <th className="text-right text-xs text-[var(--text-secondary)] py-2 px-3">Avg Price</th>
                </tr>
              </thead>
              <tbody>
                {data.years.map((year, i) => (
                  <tr key={year} className="border-b border-[var(--card-border)] last:border-0">
                    <td className="py-2 pr-4 text-[var(--text-primary)]">
                      {year}
                      {year === "2025" && (
                        <span className="ml-2 text-xs text-amber-400">*</span>
                      )}
                    </td>
                    <td className="text-right py-2 px-3 text-[var(--text-secondary)]">
                      {data.starts[i]?.toLocaleString() ?? "—"}
                    </td>
                    <td className="text-right py-2 px-3 text-[var(--text-secondary)]">
                      {data.completions[i]?.toLocaleString() ?? "—"}
                    </td>
                    <td className="text-right py-2 px-3 text-[var(--text-secondary)]">
                      {data.avgPrices[i] ? `$${(data.avgPrices[i] / 1000).toFixed(0)}K` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-amber-400/70 mt-3">
            * 2025 figures are preliminary estimates
          </p>
        </div>
      )}

      {/* Context */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">About This Data</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Historical housing data is sourced from CMHC (Canada Mortgage and Housing Corporation)
          for the Kelowna Census Metropolitan Area. Housing starts measure new residential
          construction projects begun, while completions track finished units. Average home
          prices reflect the CMHC benchmark for the region. 2025 figures are preliminary
          estimates. For current market listings and sales data, see the{" "}
          <a href="/real-estate" className="text-[var(--accent-blue)] hover:underline">
            Real Estate
          </a>{" "}
          section.
        </p>
      </div>
    </div>
  );
}

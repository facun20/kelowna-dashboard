"use client";

import { useEffect, useState } from "react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { DataTable } from "@/components/dashboard/DataTable";
import { Building2 } from "lucide-react";

interface BusinessLicence {
  id: number;
  businessName: string;
  category: string;
  status: string;
  issueDate: string;
  address: string;
  neighbourhood: string;
}

interface YearlyTotal {
  year: number;
  totalLicences: number;
  percentChange: number | null;
  source: string;
}

interface BusinessData {
  licences: BusinessLicence[];
  totalActive: number;
  topCategories: { category: string; count: number }[];
  yearlyTotals: YearlyTotal[];
}

export default function BusinessPage() {
  const [data, setData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const url = categoryFilter
      ? `/api/data/business?limit=100&category=${encodeURIComponent(categoryFilter)}`
      : `/api/data/business?limit=100`;
    fetch(url)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [categoryFilter]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Business & Economy</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Loading business data...</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Compute KPIs from yearly totals + categories data
  const totalLicences = data?.totalActive ?? 0;
  const totalCategories = data?.topCategories?.length ?? 0;
  const topCategory = data?.topCategories?.[0];

  // YoY from yearly totals
  const yearly = data?.yearlyTotals ?? [];
  const latestYear = yearly.length > 0 ? yearly[yearly.length - 1] : null;
  const priorYear = yearly.length > 1 ? yearly[yearly.length - 2] : null;
  const yoyChange = latestYear && priorYear && priorYear.totalLicences > 0
    ? Number((((latestYear.totalLicences - priorYear.totalLicences) / priorYear.totalLicences) * 100).toFixed(1))
    : null;

  // Growth since earliest year
  const earliestYear = yearly.length > 0 ? yearly[0] : null;
  const totalGrowth = earliestYear && latestYear && earliestYear.totalLicences > 0
    ? Number((((latestYear.totalLicences - earliestYear.totalLicences) / earliestYear.totalLicences) * 100).toFixed(1))
    : null;

  const kpis = [
    {
      label: latestYear ? `Licences (${latestYear.year})` : "Total Active Licences",
      value: latestYear ? latestYear.totalLicences.toLocaleString() : totalLicences.toLocaleString(),
      change: yoyChange ?? undefined,
      changeLabel: "YoY",
      trend: yoyChange !== null ? (yoyChange > 0 ? "up" as const : yoyChange < 0 ? "down" as const : "flat" as const) : "flat" as const,
    },
    {
      label: "Top Category",
      value: topCategory?.category ?? "—",
      trend: "flat" as const,
    },
    {
      label: `Growth (${earliestYear?.year ?? ""}–${latestYear?.year ?? ""})`,
      value: totalGrowth !== null ? `${totalGrowth > 0 ? "+" : ""}${totalGrowth}%` : "—",
      trend: totalGrowth !== null ? (totalGrowth > 0 ? "up" as const : "down" as const) : "flat" as const,
    },
    {
      label: "Categories Tracked",
      value: totalCategories.toString(),
      trend: "flat" as const,
    },
  ];

  // Yearly trend chart data
  const yearlyChartData = yearly.map((y) => ({
    date: String(y.year),
    value: y.totalLicences,
  }));

  // Category chart data
  const categoryChartData = (data?.topCategories ?? []).slice(0, 10).map((c) => ({
    date: c.category.length > 18 ? c.category.slice(0, 16) + "\u2026" : c.category,
    value: c.count,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <Building2 size={24} className="text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Business & Economy</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Business licence trends and category data for Kelowna
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Yearly Trend Chart */}
      {yearlyChartData.length > 0 && (
        <TrendChart
          title="Business Licences Issued Per Year"
          data={yearlyChartData}
          color="#3b82f6"
          height={260}
          valueFormatter={(v) => v.toLocaleString()}
        />
      )}

      {/* Category Distribution Chart */}
      {categoryChartData.length > 0 && (
        <TrendChart
          title="Active Licences by Category (Top 10)"
          data={categoryChartData}
          color="#8b5cf6"
          height={260}
        />
      )}

      {/* Top Categories Bar */}
      {data?.topCategories && data.topCategories.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Category Breakdown</h3>
          <div className="space-y-2">
            {data.topCategories.slice(0, 10).map((cat) => {
              const maxCount = data.topCategories[0]?.count ?? 1;
              const pct = (cat.count / maxCount) * 100;
              const sharePct = totalLicences > 0 ? ((cat.count / totalLicences) * 100).toFixed(1) : "0";
              return (
                <div key={cat.category} className="flex items-center gap-3">
                  <span className="text-sm text-[var(--text-primary)] w-44 truncate" title={cat.category}>{cat.category}</span>
                  <div className="flex-1 h-6 bg-[var(--surface)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500/30 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm text-[var(--text-secondary)] w-16 text-right">{cat.count}</span>
                  <span className="text-xs text-[var(--text-tertiary)] w-12 text-right">{sharePct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Yearly Totals Table */}
      {yearly.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Year-over-Year Totals</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)]">
                  <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">Year</th>
                  <th className="text-right py-2 px-3 text-[var(--text-secondary)] font-medium">Total Licences</th>
                  <th className="text-right py-2 px-3 text-[var(--text-secondary)] font-medium">YoY Change</th>
                  <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {[...yearly].reverse().map((y) => (
                  <tr key={y.year} className="border-b border-[var(--card-border)]/50">
                    <td className="py-2 px-3 text-[var(--text-primary)] font-medium">{y.year}</td>
                    <td className="py-2 px-3 text-right text-[var(--text-primary)]">{y.totalLicences.toLocaleString()}</td>
                    <td className={`py-2 px-3 text-right ${
                      y.percentChange !== null && y.percentChange > 0
                        ? "text-emerald-500"
                        : y.percentChange !== null && y.percentChange < 0
                        ? "text-red-500"
                        : "text-[var(--text-secondary)]"
                    }`}>
                      {y.percentChange !== null
                        ? `${y.percentChange > 0 ? "+" : ""}${y.percentChange}%`
                        : "—"}
                    </td>
                    <td className="py-2 px-3 text-[var(--text-tertiary)] text-xs">{y.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <label className="text-sm text-[var(--text-secondary)]">Filter by category:</label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {data?.topCategories?.map((c) => (
            <option key={c.category} value={c.category}>
              {c.category} ({c.count})
            </option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <DataTable
        title="Recent Business Licences"
        columns={[
          { key: "businessName" as keyof BusinessLicence, label: "Business Name" },
          { key: "category" as keyof BusinessLicence, label: "Category" },
          { key: "status" as keyof BusinessLicence, label: "Status" },
          { key: "address" as keyof BusinessLicence, label: "Address" },
        ]}
        data={(data?.licences ?? []) as unknown as Record<string, unknown>[]}
        emptyMessage="No business licence data yet. Run the ETL pipeline: /api/etl/business-licences"
      />

      {/* Context */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">About This Data</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Yearly business licence totals are sourced from City of Kelowna Council Priorities Reporting
          (2023-2024) and Statistics Canada Business Counts for the Kelowna CMA (2018-2022).
          Current active licence data and categories come from the City of Kelowna Open Data portal (ArcGIS).
          In 2024, STR legislation caused licence cancellations, offset by growth in other sectors,
          resulting in nearly flat year-over-year totals.
        </p>
      </div>
    </div>
  );
}

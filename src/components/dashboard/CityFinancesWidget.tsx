"use client";

import { useEffect, useState } from "react";
import { TrendChart } from "./TrendChart";
import { DollarSign } from "lucide-react";

interface FinanceTrend {
  year: number;
  revenue: number;
  expenses: number;
  debt: number;
  surplus: number;
}

interface FinancesData {
  available: boolean;
  latest?: {
    year: number;
    revenue: number;
    expenses: number;
    debt: number;
    surplus: number;
    debtPerCapita: number;
    revenueGrowth: number | null;
    expenseGrowth: number | null;
  };
  trend?: FinanceTrend[];
}

export function CityFinancesWidget() {
  const [data, setData] = useState<FinancesData | null>(null);

  useEffect(() => {
    fetch("/api/data/finances")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data?.available || !data.trend) {
    return null;
  }

  const revenueData = data.trend.map((y) => ({
    date: String(y.year),
    value: y.revenue,
  }));

  const expenseData = data.trend.map((y) => ({
    date: String(y.year),
    value: y.expenses,
  }));

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-emerald-500" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            City of Kelowna Finances
          </span>
        </div>
        <a
          href="/council"
          className="text-xs text-[var(--accent-blue)] hover:underline"
        >
          Full breakdown &rarr;
        </a>
      </div>

      {/* Two charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TrendChart
          title="Annual Revenue ($M)"
          data={revenueData}
          color="#10b981"
          height={200}
          valueFormatter={(v) => `$${v}M`}
        />
        <TrendChart
          title="Annual Expenses ($M)"
          data={expenseData}
          color="#f59e0b"
          height={200}
          valueFormatter={(v) => `$${v}M`}
        />
      </div>

    </div>
  );
}

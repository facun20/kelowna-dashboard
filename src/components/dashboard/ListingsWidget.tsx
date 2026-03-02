"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, TrendingDown, TrendingUp } from "lucide-react";

interface ListingsData {
  available: boolean;
  totalListings?: number;
  avgPrice?: number;
  medianPrice?: number;
  goodDeals?: unknown[];
  overpriced?: unknown[];
  message?: string;
}

export function ListingsWidget() {
  const [data, setData] = useState<ListingsData | null>(null);

  useEffect(() => {
    fetch("/api/data/listings")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data?.available) {
    return (
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Home size={16} className="text-[var(--text-secondary)]" />
          <p className="text-xs font-medium text-[var(--text-secondary)]">Real Estate</p>
        </div>
        <p className="text-xs text-[var(--text-tertiary)]">
          {data?.message ?? "Listings data loading..."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Home size={16} className="text-[var(--text-secondary)]" />
          <p className="text-xs font-medium text-[var(--text-secondary)]">Real Estate</p>
        </div>
        <Link
          href="/housing"
          className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
        >
          Details →
        </Link>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-[var(--text-primary)]">
          {data.totalListings?.toLocaleString()}
        </span>
        <span className="text-xs text-[var(--text-secondary)]">active listings</span>
      </div>

      <div className="bg-[var(--surface)] rounded-lg p-3 mb-3">
        <p className="text-xs text-[var(--text-secondary)] mb-1">Average Price</p>
        <p className="text-lg font-semibold text-[var(--text-primary)]">
          ${data.avgPrice ? (data.avgPrice / 1000).toFixed(0) + "K" : "\u2014"}
        </p>
        {data.medianPrice && (
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Median: ${(data.medianPrice / 1000).toFixed(0)}K
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5 text-center">
          <TrendingDown size={14} className="text-emerald-400 mx-auto mb-1" />
          <p className="text-sm font-semibold text-emerald-400">
            {data.goodDeals?.length ?? 0}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">Good Deals</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2.5 text-center">
          <TrendingUp size={14} className="text-red-400 mx-auto mb-1" />
          <p className="text-sm font-semibold text-red-400">
            {data.overpriced?.length ?? 0}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">Overpriced</p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { TrendingUp, TrendingDown, Home, DollarSign, Ruler, BedDouble } from "lucide-react";

interface SalesYear {
  year: number;
  totalSales: number;
  medianPrice: number;
  avgPrice: number;
  percentChangeSales: number | null;
  percentChangePrice: number | null;
  source: string;
}

interface ListingItem {
  address: string | null;
  price: number | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  listingUrl: string | null;
  photoUrl: string | null;
}

interface ListingsData {
  available: boolean;
  totalListings?: number;
  sampleSize?: number;
  totalMarketListings?: number | null;
  avgPrice?: number;
  medianPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  avgPricePerSqft?: number | null;
  avgBedrooms?: number | null;
  avgBathrooms?: number | null;
  avgSqft?: number | null;
  byType?: { type: string; count: number; avgPrice: number; medianPrice: number }[];
  byBedrooms?: { bedrooms: string; count: number; avgPrice: number }[];
  priceRanges?: { label: string; count: number }[];
  goodDeals?: ListingItem[];
  mostExpensive?: ListingItem[];
  recentListings?: ListingItem[];
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return "—";
  if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
  return `$${(price / 1000).toFixed(0)}K`;
}

function formatType(type: string | null): string {
  if (!type) return "Other";
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RealEstatePage() {
  const [salesHistory, setSalesHistory] = useState<SalesYear[]>([]);
  const [listings, setListings] = useState<ListingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/data/real-estate-sales").then((r) => r.json()).catch(() => ({ years: [] })),
      fetch("/api/data/listings").then((r) => r.json()).catch(() => null),
    ])
      .then(([salesData, listingsData]) => {
        setSalesHistory(salesData.years ?? []);
        setListings(listingsData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Real Estate</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Loading real estate data...</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const latest = salesHistory.length > 0 ? salesHistory[salesHistory.length - 1] : null;
  const salesYoyChange = latest?.percentChangeSales ?? null;
  const priceYoyChange = latest?.percentChangePrice ?? null;

  // Peak year
  const peakYear = salesHistory.reduce<SalesYear | null>(
    (max, y) => (!max || y.totalSales > max.totalSales ? y : max),
    null
  );

  const kpis = [
    {
      label: latest ? `Homes Sold (${latest.year})` : "Homes Sold",
      value: latest ? latest.totalSales.toLocaleString() : "—",
      change: salesYoyChange ?? undefined,
      changeLabel: "YoY",
      trend: salesYoyChange !== null ? (salesYoyChange > 0 ? "up" as const : "down" as const) : "flat" as const,
    },
    {
      label: "Median Sale Price",
      value: latest ? `$${Math.round(latest.medianPrice / 1000)}K` : "—",
      change: priceYoyChange ?? undefined,
      changeLabel: "YoY",
      trend: priceYoyChange !== null ? (priceYoyChange > 0 ? "up" as const : priceYoyChange < 0 ? "down" as const : "flat" as const) : "flat" as const,
    },
    {
      label: "Active Listings",
      value: listings?.totalMarketListings
        ? listings.totalMarketListings.toLocaleString()
        : listings?.totalListings?.toLocaleString() ?? "—",
      trend: "flat" as const,
    },
    {
      label: peakYear ? `Peak Year (${peakYear.year})` : "Peak Sales",
      value: peakYear ? peakYear.totalSales.toLocaleString() : "—",
      trend: "flat" as const,
    },
  ];

  // Charts
  const salesChartData = salesHistory.map((y) => ({
    date: String(y.year),
    value: y.totalSales,
  }));

  const priceChartData = salesHistory.map((y) => ({
    date: String(y.year),
    value: y.medianPrice,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <TrendingUp size={24} className="text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Real Estate</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Annual home sales, prices, and current listings in the Kelowna market
          </p>
        </div>
      </div>

      {/* KPI Cards — Historic */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {salesChartData.length > 0 && (
          <TrendChart
            title="Annual Homes Sold"
            data={salesChartData}
            color="#10b981"
            height={260}
            valueFormatter={(v) => v.toLocaleString()}
          />
        )}
        {priceChartData.length > 0 && (
          <TrendChart
            title="Median Sale Price"
            data={priceChartData}
            color="#3b82f6"
            height={260}
            valueFormatter={(v) => `$${Math.round(v / 1000)}K`}
          />
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── Active Listings Section ── */}
      {/* ═══════════════════════════════════════════════════════ */}
      {listings?.available && (
        <>
          <div className="border-t border-[var(--card-border)] pt-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Home size={20} className="text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Active Listings <span className="text-xs font-normal text-[var(--text-tertiary)]">(Updated Weekly)</span></h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {(listings.totalMarketListings ?? listings.totalListings)?.toLocaleString() ?? 0} homes currently for sale in Kelowna
                </p>
              </div>
            </div>
            <div className="mt-2 px-1">
              <p className="text-xs text-[var(--text-tertiary)] bg-[var(--surface)] rounded-lg px-3 py-2 inline-block">
                Stats below based on a sample of {listings.sampleSize?.toLocaleString() ?? listings.totalListings?.toLocaleString() ?? 0} most
                recent listings out of {(listings.totalMarketListings ?? listings.totalListings)?.toLocaleString()} total active
                in the Kelowna area. Metrics may differ slightly from the full market.
              </p>
            </div>
          </div>

          {/* Listings KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={14} className="text-blue-400" />
                <p className="text-xs text-[var(--text-secondary)]">Avg List Price</p>
              </div>
              <p className="text-xl font-bold text-[var(--text-primary)]">{formatPrice(listings.avgPrice)}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Median: {formatPrice(listings.medianPrice)}</p>
            </div>
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Ruler size={14} className="text-purple-400" />
                <p className="text-xs text-[var(--text-secondary)]">Avg Price / Sqft</p>
              </div>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {listings.avgPricePerSqft != null ? `$${listings.avgPricePerSqft.toLocaleString()}` : "—"}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Avg size: {listings.avgSqft?.toLocaleString() ?? "—"} sqft</p>
            </div>
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <BedDouble size={14} className="text-amber-400" />
                <p className="text-xs text-[var(--text-secondary)]">Avg Bedrooms</p>
              </div>
              <p className="text-xl font-bold text-[var(--text-primary)]">{listings.avgBedrooms ?? "—"}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Avg {listings.avgBathrooms ?? "—"} bathrooms</p>
            </div>
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-emerald-400" />
                <p className="text-xs text-[var(--text-secondary)]">Price Range</p>
              </div>
              <p className="text-xl font-bold text-[var(--text-primary)]">{formatPrice(listings.minPrice)}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">to {formatPrice(listings.maxPrice)}</p>
            </div>
          </div>

          {/* By Type breakdown */}
          {listings.byType && listings.byType.length > 0 && (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">By Property Type</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {listings.byType.map((t) => (
                  <div key={t.type} className="bg-[var(--surface)] rounded-lg p-4">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">{formatType(t.type)}</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">{t.count}</p>
                    <div className="flex gap-2 mt-1">
                      <p className="text-xs text-[var(--text-tertiary)]">Avg {formatPrice(t.avgPrice)}</p>
                      <span className="text-xs text-[var(--text-tertiary)]">&bull;</span>
                      <p className="text-xs text-[var(--text-tertiary)]">Med {formatPrice(t.medianPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By Bedroom Count */}
          {listings.byBedrooms && listings.byBedrooms.length > 0 && (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">By Bedroom Count</h3>
              <div className="space-y-2">
                {listings.byBedrooms.map((b) => {
                  const maxCount = Math.max(...listings.byBedrooms!.map((r) => r.count));
                  const pct = maxCount > 0 ? (b.count / maxCount) * 100 : 0;
                  return (
                    <div key={b.bedrooms} className="flex items-center gap-3">
                      <span className="text-sm text-[var(--text-primary)] w-20 shrink-0">
                        {b.bedrooms === "N/A" ? "N/A" : `${b.bedrooms} bed`}
                      </span>
                      <div className="flex-1 h-7 bg-[var(--surface)] rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-amber-500/25 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="absolute inset-0 flex items-center px-3 text-xs text-[var(--text-secondary)]">
                          Avg {formatPrice(b.avgPrice)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-[var(--text-primary)] w-10 text-right">{b.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price Distribution */}
          {listings.priceRanges && listings.priceRanges.length > 0 && (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Price Distribution</h3>
              <div className="space-y-2">
                {listings.priceRanges.map((range) => {
                  const maxCount = Math.max(...listings.priceRanges!.map((r) => r.count));
                  const pct = maxCount > 0 ? (range.count / maxCount) * 100 : 0;
                  return (
                    <div key={range.label} className="flex items-center gap-3">
                      <span className="text-sm text-[var(--text-primary)] w-32 shrink-0">{range.label}</span>
                      <div className="flex-1 h-6 bg-[var(--surface)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500/30 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-[var(--text-secondary)] w-10 text-right">{range.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Good Deals */}
          {listings.goodDeals && listings.goodDeals.length > 0 && (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown size={16} className="text-emerald-400" />
                <h3 className="text-sm font-medium text-emerald-400">Below-Average Prices</h3>
                <span className="text-xs text-[var(--text-tertiary)]">— 15%+ below avg for their type</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {listings.goodDeals.map((listing, i) => (
                  <ListingCard key={i} listing={listing} accentColor="emerald" />
                ))}
              </div>
            </div>
          )}

          {/* Most Expensive */}
          {listings.mostExpensive && listings.mostExpensive.length > 0 && (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={16} className="text-amber-400" />
                <h3 className="text-sm font-medium text-amber-400">Most Expensive</h3>
                <span className="text-xs text-[var(--text-tertiary)]">— top 5 by list price</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {listings.mostExpensive.map((listing, i) => (
                  <ListingCard key={i} listing={listing} accentColor="amber" />
                ))}
              </div>
            </div>
          )}

          {/* Recent Listings */}
          {listings.recentListings && listings.recentListings.length > 0 && (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Recent Listings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {listings.recentListings.map((l, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 bg-[var(--surface)] rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{l.address ?? "—"}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 capitalize">{formatType(l.propertyType)}</p>
                      <div className="flex gap-3 mt-1 text-xs text-[var(--text-tertiary)]">
                        {l.bedrooms != null && l.bedrooms > 0 && <span>{l.bedrooms} bed</span>}
                        {l.bathrooms != null && l.bathrooms > 0 && <span>{l.bathrooms} bath</span>}
                        {l.sqft != null && l.sqft > 0 && <span>{l.sqft.toLocaleString()} sqft</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end justify-between">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {formatPrice(l.price)}
                      </p>
                      {l.listingUrl && (
                        <a
                          href={l.listingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[var(--accent-blue)] hover:underline"
                        >
                          View →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Yearly Sales Table */}
      {salesHistory.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Year-over-Year Sales & Prices</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)]">
                  <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">Year</th>
                  <th className="text-right py-2 px-3 text-[var(--text-secondary)] font-medium">Homes Sold</th>
                  <th className="text-right py-2 px-3 text-[var(--text-secondary)] font-medium">Sales YoY</th>
                  <th className="text-right py-2 px-3 text-[var(--text-secondary)] font-medium">Median Price</th>
                  <th className="text-right py-2 px-3 text-[var(--text-secondary)] font-medium">Price YoY</th>
                </tr>
              </thead>
              <tbody>
                {[...salesHistory].reverse().map((y) => (
                  <tr key={y.year} className="border-b border-[var(--card-border)]/50">
                    <td className="py-2 px-3 text-[var(--text-primary)] font-medium">{y.year}</td>
                    <td className="py-2 px-3 text-right text-[var(--text-primary)]">{y.totalSales.toLocaleString()}</td>
                    <td className={`py-2 px-3 text-right ${
                      y.percentChangeSales !== null && y.percentChangeSales > 0
                        ? "text-emerald-500"
                        : y.percentChangeSales !== null && y.percentChangeSales < 0
                        ? "text-red-500"
                        : "text-[var(--text-secondary)]"
                    }`}>
                      {y.percentChangeSales !== null
                        ? `${y.percentChangeSales > 0 ? "+" : ""}${y.percentChangeSales}%`
                        : "—"}
                    </td>
                    <td className="py-2 px-3 text-right text-[var(--text-primary)]">
                      ${Math.round(y.medianPrice / 1000)}K
                    </td>
                    <td className={`py-2 px-3 text-right ${
                      y.percentChangePrice !== null && y.percentChangePrice > 0
                        ? "text-emerald-500"
                        : y.percentChangePrice !== null && y.percentChangePrice < 0
                        ? "text-red-500"
                        : "text-[var(--text-secondary)]"
                    }`}>
                      {y.percentChangePrice !== null
                        ? `${y.percentChangePrice > 0 ? "+" : ""}${y.percentChangePrice}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Context */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">About This Data</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Annual sales statistics are sourced from the Association of Interior REALTORS for the
          Central Okanagan / Kelowna market area. Figures include all residential property types
          (detached, townhome, condo). Active listings are pulled from Realtor.ca for the
          Kelowna area. Due to API limits, the dashboard samples the most recent {listings?.sampleSize?.toLocaleString() ?? "200"} listings
          from the full pool of active listings — metrics like average price,
          price per sqft, and bedroom breakdowns are computed from this sample and represent
          asking prices, not sold prices. For housing development data (starts, completions), see the{" "}
          <a href="/housing" className="text-[var(--accent-blue)] hover:underline">
            Housing Development
          </a>{" "}
          section.
        </p>
      </div>
    </div>
  );
}

/* ── Reusable listing card component ── */

function ListingCard({
  listing,
  accentColor,
}: {
  listing: ListingItem;
  accentColor: "emerald" | "amber" | "red" | "blue";
}) {
  const colorMap = {
    emerald: { border: "border-emerald-500/20", text: "text-emerald-400" },
    amber: { border: "border-amber-500/20", text: "text-amber-400" },
    red: { border: "border-red-500/20", text: "text-red-400" },
    blue: { border: "border-blue-500/20", text: "text-blue-400" },
  };
  const colors = colorMap[accentColor];

  return (
    <div className={`bg-[var(--surface)] border ${colors.border} rounded-lg p-4`}>
      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
        {listing.address ?? "Address unavailable"}
      </p>
      <p className={`text-lg font-bold ${colors.text} mt-1`}>
        {formatPrice(listing.price)}
      </p>
      <div className="flex gap-3 mt-2 text-xs text-[var(--text-secondary)]">
        {listing.bedrooms != null && <span>{listing.bedrooms} bed</span>}
        {listing.bathrooms != null && <span>{listing.bathrooms} bath</span>}
        {listing.sqft != null && <span>{listing.sqft.toLocaleString()} sqft</span>}
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-[var(--text-tertiary)]">{formatType(listing.propertyType)}</p>
        {listing.listingUrl && (
          <a
            href={listing.listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[var(--accent-blue)] hover:underline"
          >
            View listing →
          </a>
        )}
      </div>
    </div>
  );
}

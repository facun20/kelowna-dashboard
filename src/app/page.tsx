import { KpiCard } from "@/components/dashboard/KpiCard";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { AqiWidget } from "@/components/dashboard/AqiWidget";
import { LatestNewsSidebar } from "@/components/dashboard/LatestNewsSidebar";
import { RedditSentiment } from "@/components/dashboard/RedditSentiment";
import { OkanaganLakeWidget } from "@/components/dashboard/OkanaganLakeWidget";
import { TrafficCamerasWidget } from "@/components/dashboard/TrafficCamerasWidget";
import { AirportWidget } from "@/components/dashboard/AirportWidget";
import { CityFinancesWidget } from "@/components/dashboard/CityFinancesWidget";
import { db } from "@/lib/db";
import {
  businessLicences,
  buildingPermits,
  buildingPermitYearly,
  businessYearlyTotals,
  crimeStats,
  realEstateListings,
  realEstateSales,
} from "@/lib/schema";
import { sql, count, desc, sum } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getKpis() {
  try {
    const currentYear = new Date().getFullYear();

    // ── Population ────────────────────────────────────────────
    // 2021 Census: 222,162 (CMA). 2016 Census: 194,882. +14% over 5 years.
    const popValue = "222,162";
    const popChange = 14.0;

    // ── Business Licences — latest year from businessYearlyTotals ──
    const bizYears = db.select()
      .from(businessYearlyTotals)
      .orderBy(desc(businessYearlyTotals.year))
      .limit(2)
      .all();
    const bizLatest = bizYears[0];
    const bizPrior = bizYears[1];
    let bizChangeVal: number | undefined;
    let bizLabel = "";
    if (bizLatest) {
      bizLabel = `${bizLatest.year}`;
      if (bizPrior && bizPrior.totalLicences > 0) {
        bizChangeVal = Number(
          (((bizLatest.totalLicences - bizPrior.totalLicences) / bizPrior.totalLicences) * 100).toFixed(1)
        );
        bizLabel = `${bizLatest.year} · vs ${bizPrior.year}`;
      }
    }
    // Fall back to raw count if no yearly data
    const bizDisplay = bizLatest?.totalLicences
      ? bizLatest.totalLicences.toLocaleString()
      : (() => {
          const c = db.select({ count: count() }).from(businessLicences).get();
          return c && c.count > 0 ? c.count.toLocaleString() : "\u2014";
        })();

    // ── Permit Value — from building_permit_yearly table ────────
    const permitYears = db.select()
      .from(buildingPermitYearly)
      .orderBy(desc(buildingPermitYearly.year))
      .limit(2)
      .all();
    const permitLatest = permitYears[0];
    const permitPrior = permitYears[1];

    let permitValueStr = "\u2014";
    let permitChange: number | undefined;
    let permitLabel = "";
    if (permitLatest) {
      const v = permitLatest.totalValue;
      permitValueStr = v >= 1_000_000_000
        ? `$${(v / 1_000_000_000).toFixed(2)}B`
        : v >= 1_000_000
          ? `$${Math.round(v / 1_000_000)}M`
          : `$${Math.round(v / 1_000)}K`;
      permitLabel = `${permitLatest.year}`;
      if (permitPrior && permitPrior.totalValue > 0) {
        permitChange = Number(
          (((v - permitPrior.totalValue) / permitPrior.totalValue) * 100).toFixed(1)
        );
        permitLabel = `${permitLatest.year} · vs ${permitPrior.year}`;
      }
    }

    // ── Crime Severity Index ──────────────────────────────────
    const latestCrime = db.select().from(crimeStats)
      .where(sql`${crimeStats.offenceCategory} = 'Total CSI'`)
      .orderBy(desc(crimeStats.year))
      .limit(2)
      .all();
    const crimeLatest = latestCrime[0];
    const crimePrior = latestCrime[1];
    let crimeChange: number | undefined;
    let crimeLabel = crimeLatest?.year ? `${crimeLatest.year}` : "";
    if (crimeLatest?.ratePer100k && crimePrior?.ratePer100k) {
      crimeChange = Number(
        (((crimeLatest.ratePer100k - crimePrior.ratePer100k) / crimePrior.ratePer100k) * 100).toFixed(1)
      );
      crimeLabel = `${crimeLatest.year} · vs ${crimePrior.year}`;
    }

    // ── Avg List Price — from active listings + YoY from sales ─
    const listingPrices = db
      .select({ price: realEstateListings.price })
      .from(realEstateListings)
      .where(sql`${realEstateListings.price} IS NOT NULL AND ${realEstateListings.price} > 0`)
      .all();
    const avgListPrice =
      listingPrices.length > 0
        ? Math.round(listingPrices.reduce((s, r) => s + (r.price ?? 0), 0) / listingPrices.length)
        : null;

    // Get prior year avg price from realEstateSales for YoY
    const salesYears = db.select()
      .from(realEstateSales)
      .orderBy(desc(realEstateSales.year))
      .limit(2)
      .all();
    let priceChange: number | undefined;
    let priceLabel = "Current";
    if (salesYears[0]?.avgPrice && avgListPrice) {
      // Compare current listing avg to most recent sales year avg
      priceChange = Number(
        (((avgListPrice - salesYears[0].avgPrice) / salesYears[0].avgPrice) * 100).toFixed(1)
      );
      priceLabel = `Current · vs ${salesYears[0].year} avg`;
    }

    return [
      {
        label: "Population (CMA)",
        value: popValue,
        change: popChange,
        changeLabel: "vs 2016 Census",
        trend: "up" as const,
      },
      {
        label: "Business Licences",
        value: bizDisplay,
        change: bizChangeVal,
        changeLabel: bizLabel || `${currentYear}`,
        trend: bizChangeVal !== undefined ? (bizChangeVal > 0 ? "up" as const : "down" as const) : "flat" as const,
        href: "/business",
      },
      {
        label: "Permit Value",
        value: permitValueStr,
        change: permitChange,
        changeLabel: permitLabel,
        trend: permitChange !== undefined ? (permitChange > 0 ? "up" as const : "down" as const) : "flat" as const,
      },
      {
        label: "Crime Severity Index",
        value: crimeLatest?.ratePer100k ? crimeLatest.ratePer100k.toFixed(1) : "\u2014",
        change: crimeChange,
        changeLabel: crimeLabel,
        trend: crimeChange !== undefined ? (crimeChange < 0 ? "down" as const : "up" as const) : "flat" as const,
        href: "/crime",
      },
      {
        label: "Avg List Price",
        value: avgListPrice
          ? avgListPrice >= 1000000
            ? `$${(avgListPrice / 1000000).toFixed(2)}M`
            : `$${Math.round(avgListPrice / 1000)}K`
          : "\u2014",
        change: priceChange,
        changeLabel: priceLabel,
        trend: priceChange !== undefined ? (priceChange > 0 ? "up" as const : "down" as const) : "flat" as const,
        href: "/real-estate",
      },
    ];
  } catch {
    return [
      { label: "Population (CMA)", value: "222,162", change: 14.0, changeLabel: "vs 2016 Census", trend: "up" as const },
      { label: "Business Licences", value: "\u2014", trend: "flat" as const, href: "/business" },
      { label: "Permit Value", value: "\u2014", trend: "flat" as const },
      { label: "Crime Severity Index", value: "\u2014", trend: "flat" as const, href: "/crime" },
      { label: "Avg List Price", value: "\u2014", trend: "flat" as const, href: "/real-estate" },
    ];
  }
}

export default async function HomePage() {
  const kpis = await getKpis();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Kelowna at a Glance</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Real-time civic intelligence for the City of Kelowna, BC
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* News + Right Sidebar (Weather / AQI / Lake) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Latest News with photos */}
        <div className="flex-1 min-w-0">
          <LatestNewsSidebar />
        </div>

        {/* Right Sidebar — environment widgets */}
        <aside className="w-full lg:w-80 shrink-0 space-y-4">
          <WeatherWidget />
          <AqiWidget />
          <OkanaganLakeWidget />
        </aside>
      </div>

      {/* ─── City Finances — Revenue & Expenses YoY ─────────────── */}
      <CityFinancesWidget />

      {/* Traffic Cameras + Airport + Reddit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TrafficCamerasWidget />
        <AirportWidget />
        <RedditSentiment />
      </div>

      {/* Data Sources Footer */}
      <div className="border-t border-[var(--card-border)] pt-6">
        <p className="text-xs text-[var(--text-secondary)]">
          Data sources: Realtor.ca, Open Kelowna (ArcGIS), Statistics Canada, CMHC, City of Kelowna RSS &amp; Budget,
          Castanet, KelownaNow, CBC BC, r/kelowna, Environment Canada, DriveBC, YLW Airport. Dashboard updates automatically.
        </p>
      </div>
    </div>
  );
}

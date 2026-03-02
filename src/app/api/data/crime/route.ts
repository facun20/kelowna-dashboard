import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { crimeStats } from "@/lib/schema";
import { asc, desc, eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    // Fetch all crime stats ordered by year
    const rows = db
      .select()
      .from(crimeStats)
      .orderBy(asc(crimeStats.year))
      .all();

    // Build chart-friendly format:
    // { years: [2018, 2019, ...], series: { "Total violent crime": [val, val, ...], ... } }
    const yearsSet = new Set<number>();
    const seriesMap: Record<string, Record<number, number>> = {};

    for (const row of rows) {
      if (row.year == null || row.offenceCategory == null) continue;

      yearsSet.add(row.year);

      if (!seriesMap[row.offenceCategory]) {
        seriesMap[row.offenceCategory] = {};
      }

      // Use ratePer100k for the CSI category, incidents for others
      const value =
        row.offenceCategory === "Total CSI"
          ? row.ratePer100k ?? 0
          : row.incidents ?? 0;

      seriesMap[row.offenceCategory][row.year] = value;
    }

    const years = Array.from(yearsSet).sort((a, b) => a - b);

    const series: Record<string, number[]> = {};
    for (const [category, yearValues] of Object.entries(seriesMap)) {
      series[category] = years.map((y) => yearValues[y] ?? 0);
    }

    // Compute latest year stats
    const latestYear = years.length > 0 ? years[years.length - 1] : 0;
    const priorYear = years.length > 1 ? years[years.length - 2] : 0;

    // Get latest year rows for breakdown
    const latestRows = rows.filter((r) => r.year === latestYear);
    const priorRows = rows.filter((r) => r.year === priorYear);

    // Total incidents for latest year
    const latestTotal = latestRows.reduce((sum, r) => sum + (r.incidents ?? 0), 0);
    const priorTotal = priorRows.reduce((sum, r) => sum + (r.incidents ?? 0), 0);

    // Latest crime rate (use CSI rate if available, else sum of rates)
    const csiRow = latestRows.find((r) => r.offenceCategory === "Total CSI");
    const latestRate = csiRow?.ratePer100k ?? latestRows.reduce((sum, r) => sum + (r.ratePer100k ?? 0), 0);

    // Year-over-year change
    const yearOverYearChange = priorTotal > 0
      ? Number((((latestTotal - priorTotal) / priorTotal) * 100).toFixed(1))
      : 0;

    // Breakdown by offence type for latest year
    const breakdown = latestRows.map((r) => {
      const priorRow = priorRows.find(
        (p) => p.offenceCategory === r.offenceCategory
      );
      const priorIncidents = priorRow?.incidents ?? 0;
      const percentChange = priorIncidents > 0
        ? Number((((r.incidents ?? 0) - priorIncidents) / priorIncidents * 100).toFixed(1))
        : 0;

      return {
        offenceType: r.offenceCategory ?? r.offenceType ?? "Unknown",
        incidents: r.incidents ?? 0,
        ratePer100k: r.ratePer100k ?? 0,
        percentChange,
      };
    });

    return NextResponse.json({
      years,
      series,
      latestYear,
      latestTotal,
      latestRate,
      yearOverYearChange,
      breakdown,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

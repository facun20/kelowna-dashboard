import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { housingStats } from "@/lib/schema";
import { asc, eq, and, sql } from "drizzle-orm";

export async function GET() {
  try {
    // Fetch all housing stats ordered by period
    const rows = db
      .select()
      .from(housingStats)
      .orderBy(asc(housingStats.period))
      .all();

    // Group by period and extract specific metrics
    const periodsSet = new Set<string>();
    const startsMap: Record<string, number> = {};
    const completionsMap: Record<string, number> = {};
    const pricesMap: Record<string, number> = {};

    for (const row of rows) {
      if (row.period == null || row.metric == null) continue;
      periodsSet.add(row.period);

      if (row.metric === "starts" && (row.unitType === "all" || !row.unitType)) {
        startsMap[row.period] = row.value ?? 0;
      } else if (row.metric === "completions" && (row.unitType === "all" || !row.unitType)) {
        completionsMap[row.period] = row.value ?? 0;
      } else if (row.metric === "avg_price" && (row.unitType === "all" || !row.unitType)) {
        pricesMap[row.period] = row.value ?? 0;
      }
    }

    const years = Array.from(periodsSet).sort();
    const starts = years.map((y) => startsMap[y] ?? 0);
    const completions = years.map((y) => completionsMap[y] ?? 0);
    const avgPrices = years.map((y) => pricesMap[y] ?? 0);

    // Latest values and changes
    const latestStarts = starts.length > 0 ? starts[starts.length - 1] : 0;
    const priorStarts = starts.length > 1 ? starts[starts.length - 2] : 0;
    const startsChange = priorStarts > 0
      ? Number((((latestStarts - priorStarts) / priorStarts) * 100).toFixed(1))
      : 0;

    const latestPrice = avgPrices.length > 0 ? avgPrices[avgPrices.length - 1] : 0;
    const priorPrice = avgPrices.length > 1 ? avgPrices[avgPrices.length - 2] : 0;
    const priceChange = priorPrice > 0
      ? Number((((latestPrice - priorPrice) / priorPrice) * 100).toFixed(1))
      : 0;

    return NextResponse.json({
      years,
      starts,
      completions,
      avgPrices,
      latestStarts,
      latestPrice,
      startsChange,
      priceChange,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

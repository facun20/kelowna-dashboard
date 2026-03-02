import { db } from "@/lib/db";
import { buildingPermitYearly } from "@/lib/schema";
import { sql } from "drizzle-orm";

/**
 * Kelowna building permit yearly totals.
 *
 * Sources:
 *   - City of Kelowna Planning & Development Services reports to Council
 *   - Statistics Canada Table 34-10-0285-01 (Kelowna CMA)
 *   - BC Stats Building Permit Highlights
 *
 * All dollar values are for the City of Kelowna proper (not CMA).
 * Unit counts from city council Q1/Q2 planning reports.
 *
 * 2024 data: confirmed at $646M (Ryan Smith, Divisional Director of
 * Planning and Development Services, council presentation Aug 2025).
 * 2025: H1 reached $469M; full year not yet published as of Mar 2026.
 */
const KELOWNA_PERMIT_YEARLY: {
  year: number;
  totalValue: number;
  totalUnits: number | null;
  percentChangeValue: number;
  source: string;
}[] = [
  { year: 2019, totalValue: 670_000_000, totalUnits: null, percentChangeValue: 0, source: "City of Kelowna / Estimate" },
  { year: 2020, totalValue: 800_000_000, totalUnits: null, percentChangeValue: 19.4, source: "City of Kelowna / Estimate" },
  { year: 2021, totalValue: 1_000_000_000, totalUnits: null, percentChangeValue: 25.0, source: "City of Kelowna Council Report" },
  { year: 2022, totalValue: 1_400_000_000, totalUnits: null, percentChangeValue: 40.0, source: "City of Kelowna Council Report" },
  { year: 2023, totalValue: 1_750_000_000, totalUnits: 4000, percentChangeValue: 25.0, source: "City of Kelowna Council Report" },
  { year: 2024, totalValue: 646_000_000, totalUnits: 1603, percentChangeValue: -63.1, source: "City of Kelowna Council Report" },
];

export async function fetchAndStore(): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  for (const row of KELOWNA_PERMIT_YEARLY) {
    const existing = db
      .select()
      .from(buildingPermitYearly)
      .where(sql`${buildingPermitYearly.year} = ${row.year}`)
      .get();

    if (existing) {
      db.update(buildingPermitYearly)
        .set({
          totalValue: row.totalValue,
          totalUnits: row.totalUnits,
          percentChangeValue: row.percentChangeValue,
          source: row.source,
        })
        .where(sql`${buildingPermitYearly.year} = ${row.year}`)
        .run();
      updated++;
    } else {
      db.insert(buildingPermitYearly)
        .values({
          year: row.year,
          totalValue: row.totalValue,
          totalUnits: row.totalUnits,
          percentChangeValue: row.percentChangeValue,
          source: row.source,
        })
        .run();
      inserted++;
    }
  }

  return { inserted, updated };
}

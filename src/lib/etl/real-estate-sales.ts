import { db } from "@/lib/db";
import { realEstateSales } from "@/lib/schema";
import { sql } from "drizzle-orm";

/**
 * Kelowna & Central Okanagan annual real estate sales — seed data.
 *
 * Sources:
 *  - Association of Interior REALTORS® (via CREA Statistics)
 *  - Vantage West Realty Q2 2025 Market Report
 *  - Various Kelowna real estate market reports (Castanet, KelownaNow)
 *
 * Covers residential sales (all types: detached, townhome, condo)
 * for the Central Okanagan / Kelowna market area.
 *
 * 2025 is an estimate based on monthly data through November.
 */
const KELOWNA_RE_SALES: {
  year: number;
  totalSales: number;
  medianPrice: number;
  avgPrice: number;
  percentChangeSales: number;
  percentChangePrice: number;
  source: string;
}[] = [
  {
    year: 2018,
    totalSales: 4820,
    medianPrice: 530000,
    avgPrice: 585000,
    percentChangeSales: -24.5,
    percentChangePrice: 4.2,
    source: "Association of Interior REALTORS®",
  },
  {
    year: 2019,
    totalSales: 4650,
    medianPrice: 520000,
    avgPrice: 575000,
    percentChangeSales: -3.5,
    percentChangePrice: -1.7,
    source: "Association of Interior REALTORS®",
  },
  {
    year: 2020,
    totalSales: 5480,
    medianPrice: 555000,
    avgPrice: 620000,
    percentChangeSales: 17.8,
    percentChangePrice: 7.8,
    source: "Association of Interior REALTORS®",
  },
  {
    year: 2021,
    totalSales: 7250,
    medianPrice: 720000,
    avgPrice: 815000,
    percentChangeSales: 32.3,
    percentChangePrice: 31.5,
    source: "Association of Interior REALTORS®",
  },
  {
    year: 2022,
    totalSales: 4980,
    medianPrice: 755000,
    avgPrice: 850000,
    percentChangeSales: -31.3,
    percentChangePrice: 4.3,
    source: "Association of Interior REALTORS®",
  },
  {
    year: 2023,
    totalSales: 4320,
    medianPrice: 710000,
    avgPrice: 808000,
    percentChangeSales: -13.3,
    percentChangePrice: -4.9,
    source: "Association of Interior REALTORS®",
  },
  {
    year: 2024,
    totalSales: 4580,
    medianPrice: 715000,
    avgPrice: 812000,
    percentChangeSales: 6.0,
    percentChangePrice: 0.5,
    source: "Association of Interior REALTORS®",
  },
  {
    year: 2025,
    totalSales: 4750,
    medianPrice: 720000,
    avgPrice: 812523,
    percentChangeSales: 3.7,
    percentChangePrice: 0.1,
    source: "Association of Interior REALTORS® (est.)",
  },
];

export async function seedRealEstateSales(): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  for (const row of KELOWNA_RE_SALES) {
    const existing = db
      .select()
      .from(realEstateSales)
      .where(sql`${realEstateSales.year} = ${row.year}`)
      .get();

    if (existing) {
      db.update(realEstateSales)
        .set({
          totalSales: row.totalSales,
          medianPrice: row.medianPrice,
          avgPrice: row.avgPrice,
          percentChangeSales: row.percentChangeSales,
          percentChangePrice: row.percentChangePrice,
          source: row.source,
        })
        .where(sql`${realEstateSales.year} = ${row.year}`)
        .run();
      updated++;
    } else {
      db.insert(realEstateSales)
        .values({
          year: row.year,
          totalSales: row.totalSales,
          medianPrice: row.medianPrice,
          avgPrice: row.avgPrice,
          percentChangeSales: row.percentChangeSales,
          percentChangePrice: row.percentChangePrice,
          source: row.source,
        })
        .run();
      inserted++;
    }
  }

  return { inserted, updated };
}

export async function fetchAndStore(): Promise<{ inserted: number; updated: number }> {
  return seedRealEstateSales();
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  businessLicences,
  buildingPermits,
  crimeStats,
  realEstateListings,
} from "@/lib/schema";
import { sql, desc, sum } from "drizzle-orm";

export async function GET() {
  try {
    // Population (Kelowna CMA — 2021 Census)
    const population = 222162;

    // Count of business licences
    const bizResult = db
      .select({ count: sql<number>`count(*)` })
      .from(businessLicences)
      .get();
    const newBusinesses = bizResult?.count ?? 0;

    // Building permits — count + total value for current year
    const currentYear = new Date().getFullYear();
    const permitCountResult = db
      .select({ count: sql<number>`count(*)` })
      .from(buildingPermits)
      .get();
    const newPermits = permitCountResult?.count ?? 0;

    const permitValueResult = db
      .select({ total: sum(buildingPermits.projectValue) })
      .from(buildingPermits)
      .where(sql`${buildingPermits.issueDate} LIKE ${currentYear + '%'} AND ${buildingPermits.projectValue} IS NOT NULL`)
      .get();
    const permitValue = permitValueResult?.total ? Number(permitValueResult.total) : 0;

    // Latest crime rate (CSI for most recent year)
    const crimeResult = db
      .select({ ratePer100k: crimeStats.ratePer100k })
      .from(crimeStats)
      .where(sql`${crimeStats.offenceCategory} = 'Total CSI'`)
      .orderBy(desc(crimeStats.year))
      .limit(1)
      .get();
    const crimeRate = crimeResult?.ratePer100k ?? 0;

    // Average listing price from active realEstateListings
    const priceRows = db
      .select({ price: realEstateListings.price })
      .from(realEstateListings)
      .where(sql`${realEstateListings.price} IS NOT NULL AND ${realEstateListings.price} > 0`)
      .all();
    const avgHomePrice =
      priceRows.length > 0
        ? Math.round(
            priceRows.reduce((s, r) => s + (r.price ?? 0), 0) / priceRows.length
          )
        : 0;

    return NextResponse.json({
      population,
      crimeRate,
      newBusinesses,
      newPermits,
      permitValue,
      avgHomePrice,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

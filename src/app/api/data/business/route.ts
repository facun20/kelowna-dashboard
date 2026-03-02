import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { businessLicences, businessYearlyTotals } from "@/lib/schema";
import { desc, sql, count, eq, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "100", 10), 1),
      500
    );

    // Fetch licences (optionally filtered by category)
    let licences;
    if (category) {
      licences = db
        .select()
        .from(businessLicences)
        .where(eq(businessLicences.category, category))
        .orderBy(desc(businessLicences.fetchedAt))
        .limit(limit)
        .all();
    } else {
      licences = db
        .select()
        .from(businessLicences)
        .orderBy(desc(businessLicences.fetchedAt))
        .limit(limit)
        .all();
    }

    // Total active count — filtered by category when provided
    const totalActiveResult = category
      ? db
          .select({ count: count() })
          .from(businessLicences)
          .where(eq(businessLicences.category, category))
          .all()
      : db
          .select({ count: count() })
          .from(businessLicences)
          .all();
    const totalActive = totalActiveResult[0]?.count ?? 0;

    // Top categories with counts — ALWAYS unfiltered (feeds the dropdown)
    const topCategories = db
      .select({
        category: businessLicences.category,
        count: count(),
      })
      .from(businessLicences)
      .where(sql`${businessLicences.category} IS NOT NULL`)
      .groupBy(businessLicences.category)
      .orderBy(desc(count()))
      .limit(20)
      .all()
      .map((r) => ({
        category: r.category ?? "Unknown",
        count: r.count,
      }));

    // Yearly totals for trend chart
    const yearlyTotals = db
      .select()
      .from(businessYearlyTotals)
      .orderBy(asc(businessYearlyTotals.year))
      .all();

    return NextResponse.json({
      licences,
      totalActive,
      topCategories,
      yearlyTotals,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

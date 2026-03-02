import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildingPermits } from "@/lib/schema";
import { desc, eq, sql, count, sum } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "50", 10), 1),
      500
    );

    let results;
    if (type) {
      results = db
        .select()
        .from(buildingPermits)
        .where(eq(buildingPermits.permitType, type))
        .orderBy(desc(buildingPermits.issueDate))
        .limit(limit)
        .all();
    } else {
      results = db
        .select()
        .from(buildingPermits)
        .orderBy(desc(buildingPermits.issueDate))
        .limit(limit)
        .all();
    }

    // Fetch distinct permit types for filtering
    const types = db
      .selectDistinct({ permitType: buildingPermits.permitType })
      .from(buildingPermits)
      .where(sql`${buildingPermits.permitType} IS NOT NULL`)
      .all()
      .map((r) => r.permitType);

    // Summary stats
    const totalCount = db
      .select({ count: count() })
      .from(buildingPermits)
      .all();

    const totalValue = db
      .select({ total: sum(buildingPermits.projectValue) })
      .from(buildingPermits)
      .where(sql`${buildingPermits.projectValue} IS NOT NULL`)
      .all();

    return NextResponse.json({
      data: results,
      total: results.length,
      types,
      summary: {
        totalPermits: totalCount[0]?.count ?? 0,
        totalValue: totalValue[0]?.total ? Number(totalValue[0].total) : 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

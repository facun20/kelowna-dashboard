import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { realEstateSales } from "@/lib/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const years = db
      .select()
      .from(realEstateSales)
      .orderBy(asc(realEstateSales.year))
      .all();

    return NextResponse.json({ years });
  } catch (error) {
    return NextResponse.json(
      { error: String(error), years: [] },
      { status: 500 }
    );
  }
}

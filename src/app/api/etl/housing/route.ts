import { NextResponse } from "next/server";
import { fetchAndStore } from "@/lib/etl/housing-stats";

export async function GET() {
  try {
    const result = await fetchAndStore();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

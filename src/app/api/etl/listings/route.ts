import { NextResponse } from "next/server";
import { fetchAndStore } from "@/lib/etl/listings-fetcher";

export async function GET() {
  try {
    const result = await fetchAndStore();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

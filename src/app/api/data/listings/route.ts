import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { realEstateListings } from "@/lib/schema";
import { desc } from "drizzle-orm";

/**
 * Approximate total active listings in Kelowna from Realtor.ca.
 * The direct Realtor.ca API is behind Cloudflare bot protection,
 * so we store the last-known total here and update it periodically.
 * Last verified: March 2026 via realtor.ca search.
 */
const ESTIMATED_MARKET_TOTAL = 2735;

export async function GET() {
  try {
    const allListings = db
      .select()
      .from(realEstateListings)
      .orderBy(desc(realEstateListings.fetchedAt))
      .all();

    if (allListings.length === 0) {
      return NextResponse.json({
        available: false,
        message:
          "No listings data yet. Data populates automatically on server startup.",
      });
    }

    const sampleSize = allListings.length;
    const totalMarketListings = ESTIMATED_MARKET_TOTAL;

    /* ── Price stats ── */
    const prices = allListings
      .filter((l) => l.price != null)
      .map((l) => l.price!);
    const avgPrice =
      prices.length > 0
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : 0;

    const sorted = [...prices].sort((a, b) => a - b);
    const medianPrice =
      sorted.length > 0
        ? sorted.length % 2 === 0
          ? Math.round(
              (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            )
          : sorted[Math.floor(sorted.length / 2)]
        : 0;

    const minPrice = sorted.length > 0 ? sorted[0] : 0;
    const maxPrice = sorted.length > 0 ? sorted[sorted.length - 1] : 0;

    /* ── Per-sqft pricing ── */
    const withSqft = allListings.filter(
      (l) => l.price != null && l.sqft != null && l.sqft > 0
    );
    const avgPricePerSqft =
      withSqft.length > 0
        ? Math.round(
            withSqft.reduce((sum, l) => sum + l.price! / l.sqft!, 0) /
              withSqft.length
          )
        : null;

    /* ── Average bed / bath / sqft ── */
    const beds = allListings
      .filter((l) => l.bedrooms != null && l.bedrooms > 0)
      .map((l) => l.bedrooms!);
    const baths = allListings
      .filter((l) => l.bathrooms != null && l.bathrooms > 0)
      .map((l) => l.bathrooms!);
    const sqfts = allListings
      .filter((l) => l.sqft != null && l.sqft > 0)
      .map((l) => l.sqft!);

    const avgBedrooms =
      beds.length > 0
        ? parseFloat(
            (beds.reduce((a, b) => a + b, 0) / beds.length).toFixed(1)
          )
        : null;
    const avgBathrooms =
      baths.length > 0
        ? parseFloat(
            (baths.reduce((a, b) => a + b, 0) / baths.length).toFixed(1)
          )
        : null;
    const avgSqft =
      sqfts.length > 0
        ? Math.round(sqfts.reduce((a, b) => a + b, 0) / sqfts.length)
        : null;

    /* ── Breakdown by property type ── */
    const typeMap: Record<
      string,
      { count: number; totalPrice: number; prices: number[] }
    > = {};
    for (const l of allListings) {
      const t = l.propertyType || "other";
      if (!typeMap[t]) typeMap[t] = { count: 0, totalPrice: 0, prices: [] };
      typeMap[t].count++;
      if (l.price != null) {
        typeMap[t].totalPrice += l.price;
        typeMap[t].prices.push(l.price);
      }
    }

    const byType = Object.entries(typeMap)
      .map(([type, data]) => ({
        type,
        count: data.count,
        avgPrice:
          data.prices.length > 0
            ? Math.round(data.totalPrice / data.prices.length)
            : 0,
        medianPrice: (() => {
          if (data.prices.length === 0) return 0;
          const s = [...data.prices].sort((a, b) => a - b);
          return s.length % 2 === 0
            ? Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2)
            : s[Math.floor(s.length / 2)];
        })(),
      }))
      .sort((a, b) => b.count - a.count);

    /* ── Breakdown by bedroom count ── */
    const bedMap: Record<
      string,
      { count: number; totalPrice: number; prices: number[] }
    > = {};
    for (const l of allListings) {
      const b = l.bedrooms != null ? String(l.bedrooms) : "N/A";
      const key = l.bedrooms != null && l.bedrooms >= 5 ? "5+" : b;
      if (!bedMap[key]) bedMap[key] = { count: 0, totalPrice: 0, prices: [] };
      bedMap[key].count++;
      if (l.price != null) {
        bedMap[key].totalPrice += l.price;
        bedMap[key].prices.push(l.price);
      }
    }

    const byBedrooms = Object.entries(bedMap)
      .map(([beds, data]) => ({
        bedrooms: beds,
        count: data.count,
        avgPrice:
          data.prices.length > 0
            ? Math.round(data.totalPrice / data.prices.length)
            : 0,
      }))
      .sort((a, b) => {
        // Sort: 1, 2, 3, 4, 5+, N/A
        if (a.bedrooms === "N/A") return 1;
        if (b.bedrooms === "N/A") return -1;
        if (a.bedrooms === "5+") return 1;
        if (b.bedrooms === "5+") return -1;
        return parseInt(a.bedrooms) - parseInt(b.bedrooms);
      });

    /* ── Price distribution buckets ── */
    const buckets = [
      { label: "Under $400K", min: 0, max: 400000 },
      { label: "$400K–$600K", min: 400000, max: 600000 },
      { label: "$600K–$800K", min: 600000, max: 800000 },
      { label: "$800K–$1M", min: 800000, max: 1000000 },
      { label: "$1M–$1.5M", min: 1000000, max: 1500000 },
      { label: "Over $1.5M", min: 1500000, max: Infinity },
    ];

    const priceRanges = buckets.map((bucket) => ({
      label: bucket.label,
      count: prices.filter((p) => p >= bucket.min && p < bucket.max).length,
    }));

    /* ── Good deals — priced 15%+ below avg for their type ── */
    const goodDeals = allListings
      .filter((l) => {
        if (l.price == null) return false;
        const typeAvg = typeMap[l.propertyType || "other"]?.prices;
        if (!typeAvg || typeAvg.length < 2) return false;
        const avg = typeAvg.reduce((a, b) => a + b, 0) / typeAvg.length;
        return l.price < avg * 0.85;
      })
      .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
      .slice(0, 6)
      .map((l) => ({
        address: l.address,
        price: l.price,
        propertyType: l.propertyType,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        sqft: l.sqft,
        listingUrl: l.listingUrl,
        photoUrl: l.photoUrl,
      }));

    /* ── Most expensive listings ── */
    const mostExpensive = allListings
      .filter((l) => l.price != null)
      .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
      .slice(0, 5)
      .map((l) => ({
        address: l.address,
        price: l.price,
        propertyType: l.propertyType,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        sqft: l.sqft,
        listingUrl: l.listingUrl,
        photoUrl: l.photoUrl,
      }));

    /* ── Recent listings ── */
    const recentListings = allListings.slice(0, 12).map((l) => ({
      address: l.address,
      price: l.price,
      propertyType: l.propertyType,
      bedrooms: l.bedrooms,
      bathrooms: l.bathrooms,
      sqft: l.sqft,
      listingUrl: l.listingUrl,
      photoUrl: l.photoUrl,
    }));

    return NextResponse.json({
      available: true,
      totalListings: totalMarketListings ?? sampleSize,
      sampleSize,
      totalMarketListings,
      avgPrice,
      medianPrice,
      minPrice,
      maxPrice,
      avgPricePerSqft,
      avgBedrooms,
      avgBathrooms,
      avgSqft,
      byType,
      byBedrooms,
      priceRanges,
      goodDeals,
      mostExpensive,
      recentListings,
    });
  } catch (error) {
    return NextResponse.json(
      { available: false, error: String(error) },
      { status: 500 }
    );
  }
}

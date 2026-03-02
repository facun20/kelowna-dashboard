import { db } from "@/lib/db";
import { realEstateListings } from "@/lib/schema";
import { sql } from "drizzle-orm";

/**
 * Real estate listings fetcher — Apify + Realtor.ca.
 *
 * Primary: Runs the Apify actor "igolaizola/realtor-canada-scraper-ppe"
 *   which scrapes realtor.ca for Kelowna listings.
 *
 * Fallback: Representative seed data for the Kelowna market.
 */

const APIFY_ACTOR = "igolaizola/realtor-canada-scraper-ppe";
const APIFY_TOKEN = "apify_api_aHxnkrdAVinQcdwDLm05t9kpHb9LDk1rAKA5";
const MAX_ITEMS = 200;

/* ---------- Apify types (nested JSON from realtor.ca) ---------- */

interface ApifyListing {
  Id?: string;
  MlsNumber?: string;
  Property?: {
    Price?: string;
    PriceUnformattedValue?: number | string;
    Type?: string;
    OwnershipType?: string;
    Address?: {
      AddressText?: string;
      Longitude?: string;
      Latitude?: string;
    };
    Photo?: Array<{ HighResPath?: string; MedResPath?: string }>;
  };
  Building?: {
    Type?: string;
    Bedrooms?: string;
    BathroomTotal?: string;
    SizeInterior?: string;
    HalfBathTotal?: string;
    StoriesTotal?: string;
  };
  Land?: {
    SizeTotal?: string;
  };
  Media?: Array<{ MediaCategoryURL?: string }>;
  URL?: string;
  RelativeDetailsURL?: string;
  InsertedDateUTC?: string;
  TimeOnRealtor?: string;
  PostalCode?: string;
  PublicRemarks?: string;
  Individual?: Array<{ Name?: string }>;
}

/* ---------- Apify fetch ---------- */

async function fetchFromApify(): Promise<{
  listings: ApifyListing[];
  error?: string;
}> {
  const token = process.env.APIFY_API_TOKEN || APIFY_TOKEN;
  if (!token) {
    return { listings: [], error: "APIFY_API_TOKEN not set" };
  }

  const actorInput = {
    location: "Kelowna, BC",
    maxItems: MAX_ITEMS,
    operation: "buy",
    propertyType: "residential",
    sortBy: "newest",
  };

  // Apify requires ~ instead of / in actor name for URL paths
  const actorSlug = APIFY_ACTOR.replace("/", "~");
  const url =
    `https://api.apify.com/v2/acts/${actorSlug}/run-sync-get-dataset-items?token=${token}`;

  try {
    const controller = new AbortController();
    // Allow up to 3 minutes for the actor run
    const timeout = setTimeout(() => controller.abort(), 180_000);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(actorInput),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        listings: [],
        error: `Apify ${res.status}: ${body.slice(0, 200)}`,
      };
    }

    const data = (await res.json()) as ApifyListing[];
    if (!Array.isArray(data)) {
      return { listings: [], error: "Apify returned non-array response" };
    }

    return { listings: data };
  } catch (err) {
    return {
      listings: [],
      error: `Apify request failed: ${String(err)}`,
    };
  }
}

/* ---------- Parsers ---------- */

function parsePrice(listing: ApifyListing): number | null {
  // Prefer unformatted numeric value
  const raw = listing.Property?.PriceUnformattedValue;
  if (raw != null) {
    const num = typeof raw === "number" ? raw : parseFloat(raw);
    if (!isNaN(num) && num > 0) return num;
  }
  // Fallback to formatted string
  const priceStr = listing.Property?.Price;
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseSqft(sizeStr?: string): number | null {
  if (!sizeStr) return null;
  const match =
    sizeStr.match(/([\d,.]+)\s*sqft/i) ?? sizeStr.match(/([\d,.]+)/);
  if (!match) return null;
  const num = parseFloat(match[1].replace(/,/g, ""));
  return isNaN(num) ? null : Math.round(num);
}

function parseAddress(addressText?: string): string | null {
  if (!addressText) return null;
  // Format: "123 Main St|City, Province PostalCode"
  const parts = addressText.split("|");
  return parts[0]?.trim() || addressText;
}

function normalizePropertyType(type?: string, buildingType?: string): string {
  const combined = `${type ?? ""} ${buildingType ?? ""}`.toLowerCase();
  if (combined.includes("condo") || combined.includes("apartment"))
    return "condo";
  if (combined.includes("townhouse") || combined.includes("row"))
    return "townhome";
  if (combined.includes("duplex") || combined.includes("triplex"))
    return "duplex_triplex";
  if (combined.includes("mobile") || combined.includes("manufactured"))
    return "mobile";
  if (combined.includes("vacant") || combined.includes("land")) return "land";
  if (
    combined.includes("single") ||
    combined.includes("detached") ||
    combined.includes("house")
  )
    return "single_family";
  return "other";
}

function getPhotoUrl(listing: ApifyListing): string | null {
  // Try Property.Photo array first
  const photos = listing.Property?.Photo;
  if (Array.isArray(photos) && photos.length > 0) {
    return photos[0].HighResPath ?? photos[0].MedResPath ?? null;
  }
  // Try Media array
  if (Array.isArray(listing.Media) && listing.Media.length > 0) {
    return listing.Media[0].MediaCategoryURL ?? null;
  }
  return null;
}

function getListingUrl(listing: ApifyListing): string | null {
  if (listing.URL) return listing.URL;
  if (listing.RelativeDetailsURL)
    return `https://www.realtor.ca${listing.RelativeDetailsURL}`;
  return null;
}

/* ---------- Seed data ---------- */

const KELOWNA_LISTINGS_SEED = [
  { propertyId: "seed-001", address: "1234 Pandosy St", city: "Kelowna", propertyType: "single_family", price: 899000, bedrooms: 4, bathrooms: 3, sqft: 2400, lotSqft: 6500, yearBuilt: 2015, status: "for_sale" },
  { propertyId: "seed-002", address: "567 Bernard Ave #305", city: "Kelowna", propertyType: "condo", price: 425000, bedrooms: 2, bathrooms: 2, sqft: 950, lotSqft: 0, yearBuilt: 2020, status: "for_sale" },
  { propertyId: "seed-003", address: "890 Lakeshore Dr", city: "Kelowna", propertyType: "single_family", price: 1650000, bedrooms: 5, bathrooms: 4, sqft: 3800, lotSqft: 12000, yearBuilt: 2008, status: "for_sale" },
  { propertyId: "seed-004", address: "234 Rutland Rd S", city: "Kelowna", propertyType: "townhome", price: 545000, bedrooms: 3, bathrooms: 2.5, sqft: 1600, lotSqft: 2200, yearBuilt: 2019, status: "for_sale" },
  { propertyId: "seed-005", address: "1100 Glenmore Dr", city: "Kelowna", propertyType: "single_family", price: 725000, bedrooms: 3, bathrooms: 2, sqft: 1800, lotSqft: 5500, yearBuilt: 1992, status: "for_sale" },
  { propertyId: "seed-006", address: "456 Harvey Ave #201", city: "Kelowna", propertyType: "condo", price: 349000, bedrooms: 1, bathrooms: 1, sqft: 680, lotSqft: 0, yearBuilt: 2018, status: "for_sale" },
  { propertyId: "seed-007", address: "3200 Mission Ridge Dr", city: "Kelowna", propertyType: "single_family", price: 1250000, bedrooms: 4, bathrooms: 3, sqft: 3200, lotSqft: 8000, yearBuilt: 2012, status: "for_sale" },
  { propertyId: "seed-008", address: "789 Springfield Rd", city: "Kelowna", propertyType: "duplex_triplex", price: 875000, bedrooms: 6, bathrooms: 4, sqft: 3000, lotSqft: 7200, yearBuilt: 1985, status: "for_sale" },
  { propertyId: "seed-009", address: "555 KLO Rd #108", city: "Kelowna", propertyType: "condo", price: 395000, bedrooms: 2, bathrooms: 1, sqft: 875, lotSqft: 0, yearBuilt: 2017, status: "for_sale" },
  { propertyId: "seed-010", address: "2100 Abbott St", city: "Kelowna", propertyType: "single_family", price: 2100000, bedrooms: 5, bathrooms: 5, sqft: 4500, lotSqft: 15000, yearBuilt: 2005, status: "for_sale" },
  { propertyId: "seed-011", address: "678 Dilworth Dr", city: "Kelowna", propertyType: "townhome", price: 495000, bedrooms: 3, bathrooms: 2, sqft: 1400, lotSqft: 1800, yearBuilt: 2021, status: "for_sale" },
  { propertyId: "seed-012", address: "1450 Bertram St #412", city: "Kelowna", propertyType: "condo", price: 475000, bedrooms: 2, bathrooms: 2, sqft: 1050, lotSqft: 0, yearBuilt: 2022, status: "for_sale" },
  { propertyId: "seed-013", address: "3456 Casorso Rd", city: "Kelowna", propertyType: "single_family", price: 680000, bedrooms: 3, bathrooms: 2, sqft: 1650, lotSqft: 5000, yearBuilt: 1988, status: "for_sale" },
  { propertyId: "seed-014", address: "900 Cooper Rd", city: "Kelowna", propertyType: "single_family", price: 775000, bedrooms: 4, bathrooms: 2, sqft: 2100, lotSqft: 6000, yearBuilt: 1995, status: "for_sale" },
  { propertyId: "seed-015", address: "111 Ellis St #505", city: "Kelowna", propertyType: "condo", price: 520000, bedrooms: 2, bathrooms: 2, sqft: 1100, lotSqft: 0, yearBuilt: 2023, status: "for_sale" },
  { propertyId: "seed-016", address: "2800 Benvoulin Rd", city: "Kelowna", propertyType: "townhome", price: 599000, bedrooms: 3, bathrooms: 2.5, sqft: 1750, lotSqft: 2500, yearBuilt: 2020, status: "for_sale" },
  { propertyId: "seed-017", address: "4500 Lakeshore Rd", city: "Kelowna", propertyType: "single_family", price: 1450000, bedrooms: 4, bathrooms: 3, sqft: 2900, lotSqft: 9500, yearBuilt: 2010, status: "for_sale" },
  { propertyId: "seed-018", address: "350 Highway 33 W", city: "Kelowna", propertyType: "mobile", price: 185000, bedrooms: 2, bathrooms: 1, sqft: 900, lotSqft: 3000, yearBuilt: 1998, status: "for_sale" },
  { propertyId: "seed-019", address: "1800 Richter St", city: "Kelowna", propertyType: "single_family", price: 820000, bedrooms: 3, bathrooms: 2, sqft: 1950, lotSqft: 5800, yearBuilt: 2000, status: "for_sale" },
  { propertyId: "seed-020", address: "2200 Gordon Dr #302", city: "Kelowna", propertyType: "condo", price: 385000, bedrooms: 2, bathrooms: 1, sqft: 850, lotSqft: 0, yearBuilt: 2016, status: "for_sale" },
];

/* ---------- Main ETL ---------- */

export async function fetchAndStore(): Promise<{
  inserted: number;
  updated: number;
  errors: string[];
  source: string;
  totalAvailable?: number;
}> {
  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];
  let source = "seed";
  const now = new Date().toISOString();

  // Try Apify actor first
  const result = await fetchFromApify();

  if (result.listings.length > 0) {
    source = "apify/realtor.ca";

    for (const listing of result.listings) {
      try {
        const mlsNumber = listing.MlsNumber ?? listing.Id;
        if (!mlsNumber) continue;

        const propertyId = `mls-${mlsNumber}`;
        const address = parseAddress(listing.Property?.Address?.AddressText);

        const existing = db
          .select()
          .from(realEstateListings)
          .where(sql`${realEstateListings.propertyId} = ${propertyId}`)
          .get();

        const values = {
          propertyId,
          address,
          city: "Kelowna",
          propertyType: normalizePropertyType(
            listing.Property?.Type,
            listing.Building?.Type
          ),
          price: parsePrice(listing),
          bedrooms: listing.Building?.Bedrooms
            ? parseInt(listing.Building.Bedrooms, 10) || null
            : null,
          bathrooms: listing.Building?.BathroomTotal
            ? parseFloat(listing.Building.BathroomTotal) || null
            : null,
          sqft: parseSqft(listing.Building?.SizeInterior),
          lotSqft: parseSqft(listing.Land?.SizeTotal),
          yearBuilt: null as number | null,
          photoUrl: getPhotoUrl(listing),
          listingUrl: getListingUrl(listing),
          status: "for_sale",
          listDate: listing.InsertedDateUTC ?? null,
          fetchedAt: now,
        };

        if (existing) {
          db.update(realEstateListings)
            .set(values)
            .where(sql`${realEstateListings.propertyId} = ${propertyId}`)
            .run();
          updated++;
        } else {
          db.insert(realEstateListings).values(values).run();
          inserted++;
        }
      } catch (err) {
        errors.push(`Listing upsert error: ${String(err)}`);
      }
    }

    // Remove seed data if we got real data
    try {
      db.delete(realEstateListings)
        .where(sql`${realEstateListings.propertyId} LIKE 'seed-%'`)
        .run();
    } catch {
      // ignore
    }

    return {
      inserted,
      updated,
      errors,
      source,
      totalAvailable: result.listings.length,
    };
  }

  // Fallback: seed data
  if (result.error) {
    errors.push(result.error);
  }
  errors.push("Apify actor returned no listings. Using seed data for now.");

  source = "seed";
  for (const listing of KELOWNA_LISTINGS_SEED) {
    try {
      const existing = db
        .select()
        .from(realEstateListings)
        .where(sql`${realEstateListings.propertyId} = ${listing.propertyId}`)
        .get();

      const values = {
        ...listing,
        photoUrl: null,
        listingUrl: null,
        listDate: null,
        fetchedAt: now,
      };

      if (existing) {
        db.update(realEstateListings)
          .set(values)
          .where(
            sql`${realEstateListings.propertyId} = ${listing.propertyId}`
          )
          .run();
        updated++;
      } else {
        db.insert(realEstateListings).values(values).run();
        inserted++;
      }
    } catch (err) {
      errors.push(`Seed upsert error: ${String(err)}`);
    }
  }

  return { inserted, updated, errors, source };
}

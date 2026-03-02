import { db } from "@/lib/db";
import { buildingPermits } from "@/lib/schema";
import { sql } from "drizzle-orm";
import * as cheerio from "cheerio";

/**
 * Kelowna Building Permits ETL
 *
 * Scrapes the City of Kelowna "Approved Building Permits" page:
 *   https://www.kelowna.ca/homes-building/building-permits-inspections/approved-building-permits
 *
 * The page is server-rendered HTML with pagination via ?page=N (zero-indexed).
 * 50 results per page. Table columns:
 *   Permit | Address | Applicant | Contractor/Mailing | Sub Type | Value | Approval Date
 */

const BASE_URL =
  "https://www.kelowna.ca/homes-building/building-permits-inspections/approved-building-permits";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

interface NormalizedPermit {
  sourceId: string;
  permitType: string | null;
  projectValue: number | null;
  issueDate: string | null;
  address: string | null;
  description: string | null;
  status: string | null;
  lat: number | null;
  lon: number | null;
  rawData: string;
}

/**
 * Parse a dollar string like "$453,900" to a number.
 */
function parseDollarValue(val: string): number | null {
  const cleaned = val.replace(/[$,\s]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

/**
 * Parse a date like "February 26, 2026" to "2026-02-26".
 */
function parseApprovalDate(dateStr: string): string | null {
  try {
    const d = new Date(dateStr.trim());
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

/**
 * Fetch and parse one page of approved building permits.
 */
async function fetchPage(
  pageIndex: number,
  errors: string[]
): Promise<NormalizedPermit[]> {
  const url = pageIndex === 0 ? BASE_URL : `${BASE_URL}?page=${pageIndex}`;

  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (!res.ok) {
      errors.push(`Page ${pageIndex} returned HTTP ${res.status}`);
      return [];
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const permits: NormalizedPermit[] = [];

    // Find the permits table
    const rows = $("table tbody tr");
    if (rows.length === 0) {
      // Try alternative selectors — Drupal views sometimes use different markup
      const viewRows = $(".views-table tbody tr, .view-content table tbody tr");
      if (viewRows.length === 0) {
        return [];
      }
    }

    const tableRows = $("table tbody tr").length > 0
      ? $("table tbody tr")
      : $(".views-table tbody tr, .view-content table tbody tr");

    tableRows.each((_i, row) => {
      const cells = $(row).find("td");
      if (cells.length < 5) return; // skip malformed rows

      const permitNumber = $(cells[0]).text().trim();
      const address = $(cells[1]).text().trim();
      // cells[2] = Applicant, cells[3] = Contractor — skip
      const subType = $(cells[4]).text().trim();
      const valueStr = cells.length > 5 ? $(cells[5]).text().trim() : "";
      const approvalDateStr = cells.length > 6 ? $(cells[6]).text().trim() : "";

      if (!permitNumber) return;

      const projectValue = valueStr ? parseDollarValue(valueStr) : null;
      const issueDate = approvalDateStr ? parseApprovalDate(approvalDateStr) : null;

      permits.push({
        sourceId: `kelowna-permit-${permitNumber}`,
        permitType: subType || null,
        projectValue,
        issueDate,
        address: address || null,
        description: `${subType} - ${address}`,
        status: "Approved",
        lat: null,
        lon: null,
        rawData: JSON.stringify({
          source: "kelowna.ca/approved-building-permits",
          permitNumber,
          address,
          subType,
          value: valueStr,
          approvalDate: approvalDateStr,
        }),
      });
    });

    return permits;
  } catch (err) {
    errors.push(`Error fetching page ${pageIndex}: ${String(err)}`);
    return [];
  }
}

export async function fetchAndStore(): Promise<{
  inserted: number;
  updated: number;
  errors: string[];
}> {
  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  // Fetch pages until we get an empty result (max 10 pages = 500 permits)
  const allPermits: NormalizedPermit[] = [];
  for (let page = 0; page < 10; page++) {
    const permits = await fetchPage(page, errors);
    if (permits.length === 0) break;
    allPermits.push(...permits);
    // If we got fewer than 50, it was the last page
    if (permits.length < 50) break;
  }

  if (allPermits.length === 0) {
    errors.push(
      "No permits scraped from kelowna.ca — site may be blocking requests (403)."
    );
    return { inserted, updated, errors };
  }

  // Upsert permits
  const now = new Date().toISOString();

  for (const permit of allPermits) {
    try {
      const existing = db
        .select()
        .from(buildingPermits)
        .where(sql`${buildingPermits.sourceId} = ${permit.sourceId}`)
        .get();

      if (existing) {
        db.update(buildingPermits)
          .set({
            permitType: permit.permitType,
            projectValue: permit.projectValue,
            issueDate: permit.issueDate,
            address: permit.address,
            description: permit.description,
            status: permit.status,
            rawData: permit.rawData,
            fetchedAt: now,
          })
          .where(sql`${buildingPermits.sourceId} = ${permit.sourceId}`)
          .run();
        updated++;
      } else {
        db.insert(buildingPermits)
          .values({
            sourceId: permit.sourceId,
            permitType: permit.permitType,
            projectValue: permit.projectValue,
            issueDate: permit.issueDate,
            address: permit.address,
            description: permit.description,
            status: permit.status,
            lat: permit.lat,
            lon: permit.lon,
            rawData: permit.rawData,
            fetchedAt: now,
          })
          .run();
        inserted++;
      }
    } catch (err) {
      errors.push(`Upsert error for ${permit.sourceId}: ${String(err)}`);
    }
  }

  return { inserted, updated, errors };
}

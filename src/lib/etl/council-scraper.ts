import { db } from "@/lib/db";
import { councilMeetings } from "@/lib/schema";
import { sql } from "drizzle-orm";

/**
 * Kelowna City Council meeting scraper.
 *
 * Strategy 1: Parse the City of Kelowna meetings RSS feed at
 *   https://www.kelowna.ca/rss/meetings.xml
 *   Then construct eSCRIBE portal links for each meeting type.
 *
 * Fallback: Schedule-based seed data.
 *
 * Note: kelowna.ca returns 403 for server-side requests, so we cannot
 * scrape the HTML page directly. The RSS feed works reliably.
 */

const MEETINGS_RSS = "https://www.kelowna.ca/rss/meetings.xml";

const COUNCIL_PAGE =
  "https://www.kelowna.ca/city-hall/council/council-meetings-public-hearings";

const ESCRIBE_PORTAL = "https://kelownapublishing.escribemeetings.com";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

interface ParsedMeeting {
  meetingDate: string | null;
  meetingType: string;
  agendaUrl: string;
  minutesUrl: string | null;
  sourceId: string;
}

/**
 * Map meeting type to eSCRIBE portal calendar view URL.
 * These link to the portal's filtered view for that meeting type,
 * where users can find actual agenda PDFs and minutes.
 */
function getEscribeUrl(meetingType: string): string {
  const typeMap: Record<string, string> = {
    "AM Council Meeting": "AM+Council+Meeting",
    "PM Council Meeting": "PM+Council+Meeting",
    "Tuesday Council Meeting": "Tuesday+Council+Meeting",
    "Public Hearing": "Public+Hearing+and+Associated+Regular+Meeting",
    "Special Council Meeting": "Special+Meeting",
    "Committee Meeting": "Committee-of-the-Whole+Meeting+-+Open",
    "Inaugural Council Meeting": "Inaugural+Council+Meeting",
  };

  const expanded = typeMap[meetingType];
  if (expanded) {
    return `${ESCRIBE_PORTAL}/meetingscalendarview.aspx?Expanded=${expanded}`;
  }
  return ESCRIBE_PORTAL;
}

/**
 * Extract meeting date from a kelowna.ca meeting URL slug.
 * URL pattern: .../am-council-meeting-2026-03-02-190000
 */
function parseDateFromUrl(url: string): string | null {
  const m = url.match(/(\d{4}-\d{2}-\d{2})-\d{6}/);
  if (m) {
    const parsed = new Date(m[1] + "T12:00:00Z");
    if (!isNaN(parsed.getTime())) return m[1];
  }
  const m2 = url.match(/(\d{4}-\d{2}-\d{2})/);
  if (m2) {
    const parsed = new Date(m2[1] + "T12:00:00Z");
    if (!isNaN(parsed.getTime())) return m2[1];
  }
  return null;
}

/**
 * Determine meeting type from the RSS item title.
 */
function classifyMeetingType(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("public hearing")) return "Public Hearing";
  if (lower.includes("tuesday council")) return "Tuesday Council Meeting";
  if (lower.includes("am council")) return "AM Council Meeting";
  if (lower.includes("pm council")) return "PM Council Meeting";
  if (lower.includes("regular council") || lower.includes("regular meeting"))
    return "Regular Council Meeting";
  if (lower.includes("special")) return "Special Council Meeting";
  if (lower.includes("committee")) return "Committee Meeting";
  if (lower.includes("workshop")) return "Council Workshop";
  if (lower.includes("council")) return "Council Meeting";
  return title;
}

/**
 * Fetch and parse the kelowna.ca meetings RSS feed.
 * Maps each meeting to an eSCRIBE portal link for its type.
 */
async function fetchMeetingsRSS(
  errors: string[]
): Promise<ParsedMeeting[]> {
  const meetings: ParsedMeeting[] = [];

  try {
    const res = await fetch(MEETINGS_RSS, { headers: BROWSER_HEADERS });
    if (!res.ok) {
      errors.push(`Meetings RSS returned HTTP ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];

      const titleMatch = itemXml.match(
        /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i
      );
      const linkMatch = itemXml.match(
        /<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i
      );

      const title = titleMatch?.[1]?.trim() ?? "";
      const link = linkMatch?.[1]?.trim() ?? "";

      if (!title) continue;

      const meetingDate = parseDateFromUrl(link);
      const meetingType = classifyMeetingType(title);

      // Use eSCRIBE portal link for the agenda (actual document portal)
      const agendaUrl = getEscribeUrl(meetingType);

      const sourceId = `kelowna-rss-${Buffer.from(link || title)
        .toString("base64")
        .slice(0, 64)}`;

      meetings.push({
        meetingDate,
        meetingType,
        agendaUrl,
        minutesUrl: null, // RSS doesn't provide minutes links
        sourceId,
      });
    }
  } catch (err) {
    errors.push(`RSS fetch error: ${String(err)}`);
  }

  return meetings;
}

/**
 * Kelowna council meeting schedule seed.
 * Used as a reliable fallback when the RSS feed is unavailable.
 */
function getScheduleSeed(): ParsedMeeting[] {
  const meetings: ParsedMeeting[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();

  for (let monthOffset = -1; monthOffset <= 2; monthOffset++) {
    const d = new Date(currentYear, now.getMonth() + monthOffset, 1);
    const year = d.getFullYear();
    const month = d.getMonth();

    const mondays: Date[] = [];
    const temp = new Date(year, month, 1);
    while (temp.getMonth() === month) {
      if (temp.getDay() === 1) mondays.push(new Date(temp));
      temp.setDate(temp.getDate() + 1);
    }

    for (const idx of [0, 2]) {
      if (mondays[idx]) {
        const date = mondays[idx].toISOString().split("T")[0];
        meetings.push({
          meetingDate: date,
          meetingType: "AM Council Meeting",
          agendaUrl: getEscribeUrl("AM Council Meeting"),
          minutesUrl: null,
          sourceId: `schedule-am-${date}`,
        });
        meetings.push({
          meetingDate: date,
          meetingType: "PM Council Meeting",
          agendaUrl: getEscribeUrl("PM Council Meeting"),
          minutesUrl: null,
          sourceId: `schedule-pm-${date}`,
        });
      }
    }

    const tuesdays: Date[] = [];
    const temp2 = new Date(year, month, 1);
    while (temp2.getMonth() === month) {
      if (temp2.getDay() === 2) tuesdays.push(new Date(temp2));
      temp2.setDate(temp2.getDate() + 1);
    }
    if (tuesdays[1]) {
      const date = tuesdays[1].toISOString().split("T")[0];
      meetings.push({
        meetingDate: date,
        meetingType: "Tuesday Council Meeting",
        agendaUrl: getEscribeUrl("Tuesday Council Meeting"),
        minutesUrl: null,
        sourceId: `schedule-tuesday-${date}`,
      });
    }

    if (mondays[2]) {
      const date = mondays[2].toISOString().split("T")[0];
      meetings.push({
        meetingDate: date,
        meetingType: "Public Hearing",
        agendaUrl: getEscribeUrl("Public Hearing"),
        minutesUrl: null,
        sourceId: `schedule-hearing-${date}`,
      });
    }
  }

  return meetings;
}

export async function fetchAndStore(): Promise<{
  inserted: number;
  updated: number;
  errors: string[];
}> {
  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  // ── Strategy 1: Fetch the official meetings RSS feed ──────────
  let allMeetings = await fetchMeetingsRSS(errors);

  // ── Strategy 2: Schedule-based seed data (fallback) ───────────
  if (allMeetings.length === 0) {
    errors.push(
      "RSS feed yielded no meetings; using schedule-based seed data."
    );
    allMeetings = getScheduleSeed();
  }

  // ── Upsert all meetings ────────────────────────────────────────
  const now = new Date().toISOString();

  for (const meeting of allMeetings) {
    try {
      const existing = db
        .select()
        .from(councilMeetings)
        .where(sql`${councilMeetings.sourceId} = ${meeting.sourceId}`)
        .get();

      if (existing) {
        db.update(councilMeetings)
          .set({
            meetingDate: meeting.meetingDate,
            meetingType: meeting.meetingType,
            agendaUrl: meeting.agendaUrl,
            minutesUrl: meeting.minutesUrl,
            fetchedAt: now,
          })
          .where(sql`${councilMeetings.sourceId} = ${meeting.sourceId}`)
          .run();
        updated++;
      } else {
        db.insert(councilMeetings)
          .values({
            meetingDate: meeting.meetingDate,
            meetingType: meeting.meetingType,
            agendaUrl: meeting.agendaUrl,
            minutesUrl: meeting.minutesUrl,
            sourceId: meeting.sourceId,
            fetchedAt: now,
          })
          .run();
        inserted++;
      }
    } catch (err) {
      errors.push(`Meeting upsert error: ${String(err)}`);
    }
  }

  return { inserted, updated, errors };
}

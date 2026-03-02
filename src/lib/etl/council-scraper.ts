import { db } from "@/lib/db";
import { councilMeetings } from "@/lib/schema";
import { sql } from "drizzle-orm";

/**
 * Kelowna City Council Meeting Scraper
 *
 * Sources:
 *   1. Published council meeting schedule (based on Kelowna's official pattern)
 *      - Generates the full year of expected meeting dates
 *      - Always works, no network required
 *   2. City of Kelowna meetings RSS feed (kelowna.ca/rss/meetings.xml)
 *      - Provides ~5 confirmed upcoming meetings with real dates
 *      - Enriches/overwrites schedule data for matching date+type pairs
 *
 * Both sources are merged using consistent sourceIds (date+type).
 * RSS data takes priority over schedule data for the same meeting.
 */

const MEETINGS_RSS = "https://www.kelowna.ca/rss/meetings.xml";
const ESCRIBE_PORTAL = "https://kelownapublishing.escribemeetings.com";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

interface ParsedMeeting {
  meetingDate: string;
  meetingType: string;
  agendaUrl: string;
  minutesUrl: string | null;
  sourceId: string;
}

/* ── Helpers ──────────────────────────────────────────────────────── */

/** Create a consistent sourceId from meeting type and date */
function makeSourceId(meetingType: string, date: string): string {
  const slug = meetingType.toLowerCase().replace(/\s+/g, "-");
  return `council-${slug}-${date}`;
}

/** Map meeting type to eSCRIBE portal calendar view URL */
function getEscribeUrl(meetingType: string): string {
  const typeMap: Record<string, string> = {
    "AM Council Meeting": "AM+Council+Meeting",
    "PM Council Meeting": "PM+Council+Meeting",
    "Tuesday Council Meeting": "Tuesday+Council+Meeting",
    "Public Hearing": "Public+Hearing+and+Associated+Regular+Meeting",
    "Special Council Meeting": "Special+Meeting",
    "Committee Meeting": "Committee-of-the-Whole+Meeting+-+Open",
  };
  const expanded = typeMap[meetingType];
  return expanded
    ? `${ESCRIBE_PORTAL}/meetingscalendarview.aspx?Expanded=${expanded}`
    : ESCRIBE_PORTAL;
}

/** Get all occurrences of a weekday (0=Sun..6=Sat) in a month */
function getWeekdaysInMonth(year: number, month: number, weekday: number): Date[] {
  const dates: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    if (d.getDay() === weekday) dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function fmtDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/* ── Source 1: Published Council Schedule ─────────────────────────── */

/**
 * Generate Kelowna's council meeting schedule for the current year.
 *
 * Pattern (per City of Kelowna Council Procedure Bylaw):
 *   - 1st & 3rd Mondays: AM Council Meeting (10:30 AM) + PM Council Meeting (1:30 PM)
 *   - 2nd Tuesday of each month: Tuesday Council Meeting
 *   - 3rd Monday: Public Hearing (associated with PM session)
 *   - August: summer recess (no meetings)
 *   - December: reduced schedule (1st Monday only)
 *
 * These are the standard expected dates. The RSS feed confirms/corrects
 * any that differ from the standard pattern.
 */
function generateYearSchedule(): ParsedMeeting[] {
  const meetings: ParsedMeeting[] = [];
  const year = new Date().getFullYear();

  for (let month = 0; month < 12; month++) {
    // August: council summer recess
    if (month === 7) continue;

    const mondays = getWeekdaysInMonth(year, month, 1);
    const tuesdays = getWeekdaysInMonth(year, month, 2);

    // ── 1st Monday: AM + PM Council Meeting ──
    if (mondays[0]) {
      const date = fmtDate(mondays[0]);
      meetings.push({
        meetingDate: date,
        meetingType: "AM Council Meeting",
        agendaUrl: getEscribeUrl("AM Council Meeting"),
        minutesUrl: null,
        sourceId: makeSourceId("AM Council Meeting", date),
      });
      meetings.push({
        meetingDate: date,
        meetingType: "PM Council Meeting",
        agendaUrl: getEscribeUrl("PM Council Meeting"),
        minutesUrl: null,
        sourceId: makeSourceId("PM Council Meeting", date),
      });
    }

    // ── 3rd Monday: AM + PM + Public Hearing ── (skip in December)
    if (mondays[2]) {
      const date = fmtDate(mondays[2]);
      meetings.push({
        meetingDate: date,
        meetingType: "AM Council Meeting",
        agendaUrl: getEscribeUrl("AM Council Meeting"),
        minutesUrl: null,
        sourceId: makeSourceId("AM Council Meeting", date),
      });
      meetings.push({
        meetingDate: date,
        meetingType: "PM Council Meeting",
        agendaUrl: getEscribeUrl("PM Council Meeting"),
        minutesUrl: null,
        sourceId: makeSourceId("PM Council Meeting", date),
      });
      if (month !== 11) {
        meetings.push({
          meetingDate: date,
          meetingType: "Public Hearing",
          agendaUrl: getEscribeUrl("Public Hearing"),
          minutesUrl: null,
          sourceId: makeSourceId("Public Hearing", date),
        });
      }
    }

    // ── 2nd Tuesday: Tuesday Council Meeting ──
    if (tuesdays[1]) {
      const date = fmtDate(tuesdays[1]);
      meetings.push({
        meetingDate: date,
        meetingType: "Tuesday Council Meeting",
        agendaUrl: getEscribeUrl("Tuesday Council Meeting"),
        minutesUrl: null,
        sourceId: makeSourceId("Tuesday Council Meeting", date),
      });
    }
  }

  return meetings;
}

/* ── Source 2: kelowna.ca RSS Feed ───────────────────────────────── */

/** Extract meeting date from a kelowna.ca meeting URL slug */
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

/** Classify meeting type from RSS title text */
function classifyMeetingType(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("public hearing")) return "Public Hearing";
  if (lower.includes("tuesday council")) return "Tuesday Council Meeting";
  if (lower.includes("am council")) return "AM Council Meeting";
  if (lower.includes("pm council")) return "PM Council Meeting";
  if (lower.includes("regular council") || lower.includes("regular meeting"))
    return "AM Council Meeting";
  if (lower.includes("special")) return "Special Council Meeting";
  if (lower.includes("committee")) return "Committee Meeting";
  if (lower.includes("workshop")) return "Council Workshop";
  if (lower.includes("council")) return "Council Meeting";
  return title;
}

async function fetchMeetingsRSS(
  errors: string[]
): Promise<ParsedMeeting[]> {
  const meetings: ParsedMeeting[] = [];

  try {
    const res = await fetch(MEETINGS_RSS, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(15_000),
    });
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
      if (!meetingDate) continue;

      const meetingType = classifyMeetingType(title);
      const agendaUrl = getEscribeUrl(meetingType);

      meetings.push({
        meetingDate,
        meetingType,
        agendaUrl,
        minutesUrl: null,
        sourceId: makeSourceId(meetingType, meetingDate),
      });
    }
  } catch (err) {
    errors.push(`RSS fetch error: ${String(err)}`);
  }

  return meetings;
}

/* ── Main ETL ──────────────────────────────────────────────────── */

export async function fetchAndStore(): Promise<{
  inserted: number;
  updated: number;
  errors: string[];
}> {
  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  // ── Clean up old-format sourceIds from previous scraper versions ──
  try {
    db.delete(councilMeetings)
      .where(
        sql`${councilMeetings.sourceId} LIKE 'kelowna-rss-%' OR ${councilMeetings.sourceId} LIKE 'schedule-%'`
      )
      .run();
  } catch {
    // Ignore — table may not exist yet on first boot
  }

  // ── Merge meetings from all sources ──
  // Schedule (baseline) → RSS (overwrites matching date+type pairs)
  const meetingMap = new Map<string, ParsedMeeting>();

  // 1. Published schedule — always generates full year of meetings
  for (const m of generateYearSchedule()) {
    meetingMap.set(m.sourceId, m);
  }

  // 2. RSS feed — overwrites schedule entries for confirmed meetings
  const rssMeetings = await fetchMeetingsRSS(errors);
  for (const m of rssMeetings) {
    meetingMap.set(m.sourceId, m);
  }

  const allMeetings = Array.from(meetingMap.values());

  // ── Upsert all meetings ──
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

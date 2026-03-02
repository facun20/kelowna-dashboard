import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { councilMeetings, councilItems } from "@/lib/schema";
import { desc, eq, count } from "drizzle-orm";

export async function GET() {
  try {
    // Fetch recent council meetings ordered by date desc, limit 20
    const meetings = db
      .select()
      .from(councilMeetings)
      .orderBy(desc(councilMeetings.meetingDate))
      .limit(20)
      .all();

    // For each meeting, fetch its agenda items
    const meetingsWithItems = meetings.map((meeting) => {
      const items = db
        .select()
        .from(councilItems)
        .where(eq(councilItems.meetingId, meeting.id))
        .all()
        .map((item) => ({
          ...item,
          topicTags: item.topicTags ? JSON.parse(item.topicTags) : [],
        }));

      return {
        ...meeting,
        items,
      };
    });

    // Total counts
    const totalMeetingsResult = db
      .select({ count: count() })
      .from(councilMeetings)
      .all();
    const totalMeetings = totalMeetingsResult[0]?.count ?? 0;

    const totalItemsResult = db
      .select({ count: count() })
      .from(councilItems)
      .all();
    const totalItems = totalItemsResult[0]?.count ?? 0;

    return NextResponse.json({
      meetings: meetingsWithItems,
      totalMeetings,
      totalItems,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

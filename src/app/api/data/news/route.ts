import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsArticles, redditPosts } from "@/lib/schema";
import { desc, count } from "drizzle-orm";

interface FeedItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  textExcerpt: string | null;
  imageUrl: string | null;
  topics: string[];
  sentiment: string | null;
  type: "news" | "reddit";
  score?: number;
  numComments?: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "50", 10), 1),
      200
    );
    const typeFilter = searchParams.get("type"); // "news", "reddit", or null (both)

    // Fetch news articles (unless type=reddit)
    const articles = typeFilter === "reddit"
      ? []
      : db
          .select()
          .from(newsArticles)
          .orderBy(desc(newsArticles.publishedAt))
          .limit(limit)
          .all();

    // Fetch reddit posts (unless type=news)
    const posts = typeFilter === "news"
      ? []
      : db
          .select()
          .from(redditPosts)
          .orderBy(desc(redditPosts.createdUtc))
          .limit(limit)
          .all();

    // Total counts
    const totalNewsResult = db
      .select({ count: count() })
      .from(newsArticles)
      .all();
    const totalNews = totalNewsResult[0]?.count ?? 0;

    const totalRedditResult = db
      .select({ count: count() })
      .from(redditPosts)
      .all();
    const totalReddit = totalRedditResult[0]?.count ?? 0;

    // Normalize and merge both sources
    const items: FeedItem[] = [];

    for (const article of articles) {
      items.push({
        title: article.title || "",
        source: article.source || "News",
        url: article.url || "",
        publishedAt: article.publishedAt || "",
        textExcerpt: article.textExcerpt || null,
        imageUrl: article.imageUrl || null,
        topics: article.topics ? JSON.parse(article.topics) : [],
        sentiment: article.sentiment,
        type: "news",
      });
    }

    for (const post of posts) {
      items.push({
        title: post.title || "",
        source: `r/${post.subreddit || "kelowna"}`,
        url: post.url || "",
        publishedAt: post.createdUtc || "",
        textExcerpt: post.selftext?.slice(0, 300) || null,
        imageUrl: null,
        topics: post.topics ? JSON.parse(post.topics) : [],
        sentiment: post.sentiment,
        type: "reddit",
        score: post.score ?? undefined,
        numComments: post.numComments ?? undefined,
      });
    }

    // Sort by published date descending
    items.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

    // Limit combined results
    const result = items.slice(0, limit);

    return NextResponse.json({
      items: result,
      totalNews,
      totalReddit,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

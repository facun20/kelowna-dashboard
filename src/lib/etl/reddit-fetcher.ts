import { db } from "@/lib/db";
import { redditPosts } from "@/lib/schema";
import Parser from "rss-parser";

/**
 * Reddit ETL — tries JSON API first (has score/comments), falls back to RSS.
 * Reddit blocks unauthenticated JSON requests from datacenter IPs,
 * but the RSS feed is more reliably accessible from servers.
 */

const RSS_URL = "https://www.reddit.com/r/kelowna/new/.rss?limit=50";
const JSON_URL = "https://www.reddit.com/r/kelowna/new.json?limit=100";

const USER_AGENT =
  "KelownaCivicDashboard/1.0 (by civic-dashboard-bot; educational project)";

interface RedditChild {
  kind: string;
  data: {
    id: string;
    name: string;
    subreddit: string;
    title: string;
    url: string;
    selftext: string;
    created_utc: number;
    score: number;
    num_comments: number;
    permalink: string;
  };
}

interface RedditListing {
  kind: string;
  data: {
    children: RedditChild[];
    after: string | null;
  };
}

interface ParsedPost {
  redditId: string;
  title: string;
  url: string;
  selftext: string | null;
  createdUtc: string | null;
  score: number;
  numComments: number;
}

/** Strategy 1: JSON API (richer data — score + comments) */
async function fetchViaJson(): Promise<{ posts: ParsedPost[]; error?: string }> {
  try {
    const res = await fetch(JSON_URL, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!res.ok) return { posts: [], error: `JSON API HTTP ${res.status}` };

    const body: RedditListing = await res.json();
    if (!body?.data?.children?.length) return { posts: [], error: "No posts in JSON" };

    return {
      posts: body.data.children.map((child) => {
        const p = child.data;
        return {
          redditId: p.id,
          title: p.title ?? "",
          url: p.permalink ? `https://www.reddit.com${p.permalink}` : p.url ?? "",
          selftext: p.selftext || null,
          createdUtc: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : null,
          score: p.score ?? 0,
          numComments: p.num_comments ?? 0,
        };
      }),
    };
  } catch (err) {
    return { posts: [], error: `JSON failed: ${String(err)}` };
  }
}

/** Strategy 2: RSS feed (works from datacenter IPs, less data) */
async function fetchViaRss(): Promise<{ posts: ParsedPost[]; error?: string }> {
  try {
    const parser = new Parser({
      timeout: 15_000,
      headers: { "User-Agent": USER_AGENT },
    });
    const feed = await parser.parseURL(RSS_URL);

    return {
      posts: (feed.items ?? []).map((item) => {
        const link = item.link ?? "";
        const idMatch = link.match(/\/comments\/(\w+)/);
        return {
          redditId: idMatch?.[1] ?? item.id ?? link,
          title: item.title ?? "",
          url: link,
          selftext: item.contentSnippet?.slice(0, 1000) ?? null,
          createdUtc: item.isoDate ?? null,
          score: 0,
          numComments: 0,
        };
      }),
    };
  } catch (err) {
    return { posts: [], error: `RSS failed: ${String(err)}` };
  }
}

export async function fetchAndStore(): Promise<{
  inserted: number;
  updated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let inserted = 0;
  const updated = 0;

  // Try JSON first, fall back to RSS
  let posts: ParsedPost[] = [];
  const jsonResult = await fetchViaJson();
  if (jsonResult.posts.length > 0) {
    posts = jsonResult.posts;
  } else {
    if (jsonResult.error) errors.push(jsonResult.error);
    const rssResult = await fetchViaRss();
    if (rssResult.posts.length > 0) {
      posts = rssResult.posts;
      errors.push("Used RSS (JSON API blocked from server).");
    } else {
      if (rssResult.error) errors.push(rssResult.error);
      errors.push("Both Reddit JSON and RSS failed from this server.");
      return { inserted, updated, errors };
    }
  }

  const now = new Date().toISOString();
  for (const post of posts) {
    try {
      await db
        .insert(redditPosts)
        .values({
          redditId: post.redditId,
          subreddit: "kelowna",
          title: post.title,
          url: post.url,
          selftext: post.selftext,
          createdUtc: post.createdUtc,
          score: post.score,
          numComments: post.numComments,
          topics: null,
          sentiment: null,
          fetchedAt: now,
        })
        .onConflictDoUpdate({
          target: redditPosts.redditId,
          set: {
            title: post.title,
            url: post.url,
            selftext: post.selftext,
            score: post.score,
            numComments: post.numComments,
            fetchedAt: now,
          },
        })
        .run();
      inserted++;
    } catch (err) {
      errors.push(`Upsert error: ${String(err)}`);
    }
  }

  return { inserted, updated, errors };
}

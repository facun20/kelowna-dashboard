import { db } from "@/lib/db";
import { redditPosts } from "@/lib/schema";

const SUBREDDIT_URL =
  "https://www.reddit.com/r/kelowna/new.json?limit=100";

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

export async function fetchAndStore(): Promise<{
  inserted: number;
  updated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let inserted = 0;
  const updated = 0;

  // ── 1. Fetch from Reddit ─────────────────────────────────────────
  let children: RedditChild[] = [];

  try {
    const res = await fetch(SUBREDDIT_URL, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      errors.push(
        `Reddit API returned HTTP ${res.status}: ${res.statusText}`
      );
      return { inserted, updated, errors };
    }

    const body: RedditListing = await res.json();

    if (!body?.data?.children || !Array.isArray(body.data.children)) {
      errors.push("Reddit response has unexpected shape — no data.children.");
      return { inserted, updated, errors };
    }

    children = body.data.children;
  } catch (err) {
    errors.push(`Failed to fetch Reddit data: ${String(err)}`);
    return { inserted, updated, errors };
  }

  if (children.length === 0) {
    errors.push("Reddit returned zero posts.");
    return { inserted, updated, errors };
  }

  // ── 2. Upsert posts ─────────────────────────────────────────────
  const now = new Date().toISOString();

  for (const child of children) {
    try {
      const post = child.data;
      if (!post || !post.id) {
        errors.push("Skipped child with missing data or id.");
        continue;
      }

      const createdUtc = post.created_utc
        ? new Date(post.created_utc * 1000).toISOString()
        : null;

      const postUrl = post.permalink
        ? `https://www.reddit.com${post.permalink}`
        : post.url ?? null;

      await db
        .insert(redditPosts)
        .values({
          redditId: post.id,
          subreddit: post.subreddit ?? "kelowna",
          title: post.title ?? "",
          url: postUrl,
          selftext: post.selftext || null,
          createdUtc,
          score: post.score ?? 0,
          numComments: post.num_comments ?? 0,
          topics: null, // populated by a future NLP step
          sentiment: null,
          fetchedAt: now,
        })
        .onConflictDoUpdate({
          target: redditPosts.redditId,
          set: {
            title: post.title ?? "",
            url: postUrl,
            selftext: post.selftext || null,
            score: post.score ?? 0,
            numComments: post.num_comments ?? 0,
            fetchedAt: now,
          },
        })
        .run();

      inserted++;
    } catch (err) {
      errors.push(`Upsert error for reddit post: ${String(err)}`);
    }
  }

  return { inserted, updated, errors };
}

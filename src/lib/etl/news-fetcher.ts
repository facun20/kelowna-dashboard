import { db } from "@/lib/db";
import { newsArticles } from "@/lib/schema";
import Parser from "rss-parser";

const RSS_FEEDS = [
  {
    name: "Kelowna News",
    url: "https://rss.app/feeds/tj6ek1fEI06fdgCI.xml",
    filterForKelowna: false, // aggregated Kelowna feed — all articles relevant
  },
  {
    name: "CBC BC",
    url: "https://www.cbc.ca/webfeed/rss/rss-canada-britishcolumbia",
    filterForKelowna: true, // provincial feed — only keep Kelowna mentions
  },
];

const KELOWNA_REGEX = /kelowna/i;

interface NormalizedArticle {
  source: string;
  title: string;
  url: string;
  publishedAt: string | null;
  textExcerpt: string | null;
  imageUrl: string | null;
}

/**
 * Extract og:image (or twitter:image) from a web page's HTML <head>.
 * Uses a lightweight fetch + regex approach — no extra npm deps.
 * Times out after 8s to avoid blocking the ETL pipeline.
 */
async function extractOgImage(articleUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(articleUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; KelownaDashboard/1.0; +https://kelowna-dashboard.local)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    // Read the first 50KB to find <head> meta tags (some sites inject scripts before meta)
    const reader = res.body?.getReader();
    if (!reader) return null;

    let html = "";
    const decoder = new TextDecoder();
    while (html.length < 50_000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel().catch(() => {});

    // Try og:image first (with multiple attribute orders & spacing patterns)
    const ogMatch = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    ) ?? html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
    );
    if (ogMatch?.[1]) return ogMatch[1];

    // og:image:url variant
    const ogUrlMatch = html.match(
      /<meta[^>]+property=["']og:image:url["'][^>]+content=["']([^"']+)["']/i
    ) ?? html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image:url["']/i
    );
    if (ogUrlMatch?.[1]) return ogUrlMatch[1];

    // og:image:secure_url variant
    const ogSecMatch = html.match(
      /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i
    );
    if (ogSecMatch?.[1]) return ogSecMatch[1];

    // Fall back to twitter:image
    const twMatch = html.match(
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i
    ) ?? html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i
    );
    if (twMatch?.[1]) return twMatch[1];

    // twitter:image:src variant
    const twSrcMatch = html.match(
      /<meta[^>]+name=["']twitter:image:src["'][^>]+content=["']([^"']+)["']/i
    );
    if (twSrcMatch?.[1]) return twSrcMatch[1];

    // Last resort: try to find a large image in the article body
    // Match the first img with src containing common image patterns
    const imgMatch = html.match(
      /<img[^>]+src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i
    );
    if (imgMatch?.[1]) {
      // Skip tiny tracking pixels and icons — only accept if URL looks like a real image
      const url = imgMatch[1];
      if (!url.includes("pixel") && !url.includes("tracking") && !url.includes("1x1") && !url.includes("icon")) {
        return url;
      }
    }

    return null;
  } catch {
    return null; // timeout, network error, etc.
  }
}

/**
 * Extract image URL from RSS item fields:
 * <media:content>, <media:thumbnail>, <enclosure type="image/...">
 */
function extractRssImage(item: Record<string, unknown>): string | null {
  // media:content or media:thumbnail
  const mediaContent = item["media:content"] as Record<string, unknown> | undefined;
  if (mediaContent) {
    const attrs = (mediaContent["$"] ?? mediaContent) as Record<string, string>;
    if (attrs?.url && attrs?.type?.startsWith?.("image")) return attrs.url;
    if (attrs?.url && !attrs?.type) return attrs.url; // assume image if no type
  }

  const mediaThumbnail = item["media:thumbnail"] as Record<string, unknown> | undefined;
  if (mediaThumbnail) {
    const attrs = (mediaThumbnail["$"] ?? mediaThumbnail) as Record<string, string>;
    if (attrs?.url) return attrs.url;
  }

  // enclosure
  const enclosure = item.enclosure as Record<string, unknown> | undefined;
  if (enclosure) {
    const attrs = (enclosure["$"] ?? enclosure) as Record<string, string>;
    if (attrs?.url && attrs?.type?.startsWith?.("image")) return attrs.url;
  }

  // itunes:image (some feeds)
  const itunesImage = item["itunes:image"] as Record<string, unknown> | undefined;
  if (itunesImage) {
    const attrs = (itunesImage["$"] ?? itunesImage) as Record<string, string>;
    if (attrs?.href) return attrs.href;
  }

  return null;
}

export async function fetchAndStore(): Promise<{
  inserted: number;
  updated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let inserted = 0;
  const updated = 0;

  const parser = new Parser({
    timeout: 20_000,
    headers: {
      "User-Agent": "KelownaCivicDashboard/1.0 (RSS reader)",
    },
    customFields: {
      item: [
        ["media:content", "media:content"],
        ["media:thumbnail", "media:thumbnail"],
        ["enclosure", "enclosure"],
      ],
    },
  });

  const allArticles: NormalizedArticle[] = [];

  // ── Fetch each feed concurrently ─────────────────────────────────
  const feedPromises = RSS_FEEDS.map(async (feed) => {
    try {
      const result = await parser.parseURL(feed.url);
      const items = result.items ?? [];

      for (const item of items) {
        const title = item.title?.trim() ?? "";
        const url = item.link?.trim() ?? "";
        if (!url) continue; // skip items with no URL

        const content = item.contentSnippet ?? item.content ?? "";

        // Apply Kelowna filter for provincial/national feeds
        if (feed.filterForKelowna) {
          const haystack = `${title} ${content}`;
          if (!KELOWNA_REGEX.test(haystack)) continue;
        }

        // Extract per-article source from RSS creator field when available
        const itemAny = item as unknown as Record<string, unknown>;
        const rawSource = itemAny.creator ?? itemAny["dc:creator"] ?? null;
        const articleSource =
          typeof rawSource === "string" && rawSource.trim()
            ? rawSource.trim()
            : feed.name;

        // Try to get image from RSS fields first
        let articleImage = extractRssImage(itemAny);

        // If no RSS image field, try parsing <img> from the description HTML
        if (!articleImage && item.content) {
          const imgMatch = (item.content as string).match(
            /<img[^>]+src=["'](https?:\/\/[^"']+)["']/i
          );
          if (imgMatch?.[1]) {
            const imgUrl = imgMatch[1];
            // Skip tiny tracking pixels, spacers, icons
            if (
              !imgUrl.includes("pixel") &&
              !imgUrl.includes("tracking") &&
              !imgUrl.includes("1x1") &&
              !imgUrl.includes("spacer") &&
              !imgUrl.includes("data:image")
            ) {
              articleImage = imgUrl;
            }
          }
        }

        allArticles.push({
          source: articleSource,
          title: title || "Untitled",
          url,
          publishedAt: item.isoDate ?? item.pubDate ?? null,
          textExcerpt: content ? content.slice(0, 500) : null,
          imageUrl: articleImage, // may still be null; we'll try og:image next
        });
      }
    } catch (err) {
      errors.push(`Error fetching feed "${feed.name}": ${String(err)}`);
    }
  });

  await Promise.all(feedPromises);

  if (allArticles.length === 0 && errors.length === 0) {
    errors.push("No articles found from any RSS feed.");
    return { inserted, updated, errors };
  }

  // ── Extract og:image for articles that don't have an RSS image ──
  // Process up to 10 concurrently to avoid overwhelming servers
  const needsOgImage = allArticles.filter((a) => !a.imageUrl);
  const OG_BATCH_SIZE = 5;
  for (let i = 0; i < needsOgImage.length; i += OG_BATCH_SIZE) {
    const batch = needsOgImage.slice(i, i + OG_BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (article) => {
        const ogImage = await extractOgImage(article.url);
        if (ogImage) article.imageUrl = ogImage;
      })
    );
    // Log any failures silently (non-critical)
    for (const r of results) {
      if (r.status === "rejected") {
        // don't add to errors — og:image is best-effort
      }
    }
  }

  // ── Upsert articles ──────────────────────────────────────────────
  const now = new Date().toISOString();

  for (const article of allArticles) {
    try {
      await db
        .insert(newsArticles)
        .values({
          source: article.source,
          title: article.title,
          url: article.url,
          publishedAt: article.publishedAt,
          textExcerpt: article.textExcerpt,
          imageUrl: article.imageUrl,
          topics: null,
          sentiment: null,
          fetchedAt: now,
        })
        .onConflictDoUpdate({
          target: newsArticles.url,
          set: {
            source: article.source,
            title: article.title,
            publishedAt: article.publishedAt,
            textExcerpt: article.textExcerpt,
            imageUrl: article.imageUrl,
            fetchedAt: now,
          },
        })
        .run();

      inserted++;
    } catch (err) {
      errors.push(`Upsert error for "${article.url}": ${String(err)}`);
    }
  }

  return { inserted, updated, errors };
}

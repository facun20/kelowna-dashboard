"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, TrendingUp, ArrowUpRight } from "lucide-react";

interface RedditPost {
  title: string;
  url: string;
  score: number;
  numComments: number;
  createdUtc: string;
  subreddit: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return "";
  const diff = now - then;
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "< 1h ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RedditSentiment() {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/data/news?limit=8&type=reddit")
      .then((r) => r.json())
      .then((data) => {
        const items = (data.items ?? []).map((item: Record<string, unknown>) => ({
          title: (item.title as string) ?? "",
          url: (item.url as string) ?? "",
          score: (item.score as number) ?? 0,
          numComments: (item.numComments as number) ?? 0,
          createdUtc: (item.publishedAt as string) ?? (item.createdUtc as string) ?? "",
          subreddit: (item.subreddit as string) ?? "kelowna",
        }));
        setPosts(items);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-orange-500" />
          <h3 className="text-xs font-medium text-[var(--text-secondary)]">r/kelowna</h3>
        </div>
        <Link
          href="/news"
          className="text-xs text-orange-500 hover:text-orange-400 transition-colors"
        >
          View All →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-[var(--skeleton)] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-xs text-[var(--text-tertiary)] py-4 text-center">
          Reddit data populates automatically on startup.
        </p>
      ) : (
        <div className="space-y-1">
          {posts.map((post, i) => (
            <a
              key={i}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-2 py-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors group"
            >
              <p className="text-sm text-[var(--text-primary)] line-clamp-2 group-hover:text-orange-500 transition-colors">
                {post.title}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-0.5 text-xs text-[var(--text-tertiary)]">
                  <TrendingUp size={10} /> {post.score}
                </span>
                <span className="flex items-center gap-0.5 text-xs text-[var(--text-tertiary)]">
                  <MessageCircle size={10} /> {post.numComments}
                </span>
                {post.createdUtc && (
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {timeAgo(post.createdUtc)}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

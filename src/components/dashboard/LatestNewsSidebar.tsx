"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Newspaper, Image as ImageIcon } from "lucide-react";

interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  imageUrl?: string | null;
  textExcerpt?: string | null;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return "";

  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function PlaceholderImage({ source }: { source: string }) {
  const hue = source.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 40%, 85%) 0%, hsl(${(hue + 40) % 360}, 35%, 75%) 100%)`,
      }}
    >
      <ImageIcon size={18} className="text-white/60" />
    </div>
  );
}

export function LatestNewsSidebar() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/data/news?limit=10&type=news")
      .then((r) => r.json())
      .then((data) => {
        const articles: NewsItem[] = (data.items ?? []).map(
          (item: Record<string, unknown>) => ({
            title: (item.title as string) ?? "",
            source: (item.source as string) ?? "",
            url: (item.url as string) ?? "",
            publishedAt: (item.publishedAt as string) ?? "",
            imageUrl: (item.imageUrl as string | null) ?? null,
            textExcerpt: (item.textExcerpt as string | null) ?? null,
          })
        );
        // Show up to 8 articles
        setItems(articles.slice(0, 8));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Newspaper size={16} className="text-orange-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Latest News</h3>
        </div>
        <Link
          href="/news"
          className="text-xs text-[var(--accent-blue)] hover:underline transition-colors"
        >
          View All →
        </Link>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-20 h-14 bg-[var(--skeleton)] rounded-lg animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[var(--skeleton)] rounded animate-pulse w-full" />
                <div className="h-3 bg-[var(--skeleton)] rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-[var(--text-tertiary)] py-6 text-center px-4">
          No news yet. Data populates automatically on startup.
        </p>
      ) : (
        <div className="divide-y divide-[var(--card-border)]">
          {items.map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 p-3 hover:bg-[var(--card-hover)] transition-colors group"
            >
              {/* Thumbnail */}
              <div className="w-20 h-14 shrink-0 rounded-lg overflow-hidden bg-[var(--surface)]">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) parent.classList.add("flex", "items-center", "justify-center");
                    }}
                  />
                ) : (
                  <PlaceholderImage source={item.source} />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--accent-blue)] transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[var(--text-tertiary)]">{item.source}</span>
                  {item.publishedAt && (
                    <>
                      <span className="text-[var(--text-tertiary)]">·</span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {timeAgo(item.publishedAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

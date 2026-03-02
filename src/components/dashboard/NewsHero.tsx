"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Newspaper } from "lucide-react";

interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  textExcerpt?: string;
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

export function NewsHero() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/data/news?limit=8&type=news")
      .then((r) => r.json())
      .then((data) => {
        const articles = (data.items ?? []).map((item: Record<string, unknown>) => ({
          title: (item.title as string) ?? "",
          source: (item.source as string) ?? "",
          url: (item.url as string) ?? "",
          publishedAt: (item.publishedAt as string) ?? "",
          textExcerpt: (item.textExcerpt as string) ?? "",
        }));
        setItems(articles);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Latest News</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-8 text-center">
        <Newspaper size={32} className="text-[var(--text-tertiary)] mx-auto mb-3" />
        <p className="text-sm text-[var(--text-secondary)]">
          News articles will appear here after the ETL pipeline runs.
        </p>
      </div>
    );
  }

  const featured = items[0];
  const rest = items.slice(1, 7);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Latest News</h2>
        <Link
          href="/news"
          className="text-sm text-[var(--accent-blue)] hover:opacity-80 transition-opacity"
        >
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Featured article - large card */}
        <a
          href={featured.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 hover:border-[var(--accent-blue)]/30 transition-colors md:row-span-2 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-medium">
                {featured.source}
              </span>
              {featured.publishedAt && (
                <span className="text-xs text-[var(--text-tertiary)]">
                  {timeAgo(featured.publishedAt)}
                </span>
              )}
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] leading-tight group-hover:text-[var(--accent-blue)] transition-colors mb-3">
              {featured.title}
            </h3>
            {featured.textExcerpt && (
              <p className="text-sm text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                {featured.textExcerpt}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 mt-4 text-xs text-[var(--text-tertiary)]">
            <span>Read article</span>
            <ExternalLink size={12} />
          </div>
        </a>

        {/* Secondary articles - smaller cards */}
        {rest.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 hover:border-[var(--accent-blue)]/30 transition-colors flex flex-col justify-between"
          >
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)] leading-snug group-hover:text-[var(--accent-blue)] transition-colors line-clamp-2">
                {item.title}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--tag-bg)] text-[var(--text-secondary)]">
                {item.source}
              </span>
              {item.publishedAt && (
                <span className="text-xs text-[var(--text-tertiary)]">
                  {timeAgo(item.publishedAt)}
                </span>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

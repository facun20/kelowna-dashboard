"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Newspaper, MessageSquare, Image as ImageIcon, TrendingUp } from "lucide-react";

interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  textExcerpt?: string;
  imageUrl?: string | null;
  type: "news" | "reddit";
  score?: number;
  numComments?: number;
}

interface NewsData {
  items: NewsItem[];
  totalNews: number;
  totalReddit: number;
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
      <ImageIcon size={24} className="text-white/60" />
    </div>
  );
}

export default function NewsPage() {
  const [data, setData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/data/news?limit=50")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">News & Community</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Loading...</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl h-72 animate-pulse" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl h-24 animate-pulse" />
            ))}
          </div>
          <div className="w-full lg:w-80 bg-[var(--card)] border border-[var(--card-border)] rounded-xl h-96 animate-pulse" />
        </div>
      </div>
    );
  }

  const newsItems = data?.items?.filter((i) => i.type === "news") ?? [];
  const redditItems = data?.items?.filter((i) => i.type === "reddit") ?? [];
  const featured = newsItems[0];
  const moreNews = newsItems.slice(1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-orange-500/10">
          <Newspaper size={24} className="text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">News & Community</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Local news from Kelowna media and community discussion from r/kelowna
          </p>
        </div>
      </div>

      {/* Main Layout: News left, Reddit sidebar right */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: News Articles */}
        <div className="flex-1 min-w-0 space-y-4">
          {newsItems.length === 0 ? (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-8 text-center">
              <Newspaper size={32} className="text-[var(--text-tertiary)] mx-auto mb-3" />
              <p className="text-sm text-[var(--text-secondary)]">No news articles yet.</p>
            </div>
          ) : (
            <>
              {/* Featured hero */}
              {featured && (
                <a
                  href={featured.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden hover:border-[var(--accent-blue)]/30 transition-colors"
                >
                  <div className="h-56 lg:h-72 overflow-hidden bg-[var(--surface)]">
                    {featured.imageUrl ? (
                      <img src={featured.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="eager" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <PlaceholderImage source={featured.source} />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">{featured.source}</span>
                      {featured.publishedAt && <span className="text-xs text-[var(--text-tertiary)]">{timeAgo(featured.publishedAt)}</span>}
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] leading-tight group-hover:text-[var(--accent-blue)] transition-colors">{featured.title}</h3>
                    {featured.textExcerpt && <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2 leading-relaxed">{featured.textExcerpt}</p>}
                  </div>
                </a>
              )}

              {/* More news cards with thumbnails */}
              {moreNews.map((item, i) => (
                <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="group bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden hover:border-[var(--accent-blue)]/30 transition-colors flex">
                  <div className="w-28 sm:w-36 shrink-0 overflow-hidden bg-[var(--surface)]">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <PlaceholderImage source={item.source} />
                    )}
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)] leading-snug group-hover:text-[var(--accent-blue)] transition-colors line-clamp-2">{item.title}</p>
                      {item.textExcerpt && <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">{item.textExcerpt}</p>}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--tag-bg)] text-[var(--text-secondary)]">{item.source}</span>
                      {item.publishedAt && <span className="text-xs text-[var(--text-tertiary)]">{timeAgo(item.publishedAt)}</span>}
                    </div>
                  </div>
                </a>
              ))}
            </>
          )}
        </div>

        {/* Right Sidebar: Reddit */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 lg:sticky lg:top-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} className="text-orange-500" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">r/kelowna</h3>
              <span className="text-xs text-[var(--text-tertiary)] ml-auto">Community</span>
            </div>

            {redditItems.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)] py-4 text-center">No Reddit posts yet.</p>
            ) : (
              <div className="space-y-1">
                {redditItems.map((post, i) => (
                  <a key={i} href={post.url} target="_blank" rel="noopener noreferrer" className="block px-3 py-2.5 rounded-lg hover:bg-[var(--card-hover)] transition-colors group">
                    <p className="text-sm text-[var(--text-primary)] leading-snug group-hover:text-orange-500 transition-colors line-clamp-2">{post.title}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-0.5 text-xs text-[var(--text-tertiary)]"><TrendingUp size={10} /> {post.score ?? 0}</span>
                      <span className="flex items-center gap-0.5 text-xs text-[var(--text-tertiary)]"><MessageSquare size={10} /> {post.numComments ?? 0}</span>
                      {post.publishedAt && <span className="text-xs text-[var(--text-tertiary)]">{timeAgo(post.publishedAt)}</span>}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Source info */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Sources</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          News from KelownaNow, Castanet, CBC British Columbia via RSS.
          Article images extracted from og:image meta tags. Reddit posts from r/kelowna.
          Content refreshes every 6 hours.
        </p>
      </div>
    </div>
  );
}

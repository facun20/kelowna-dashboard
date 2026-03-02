"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment?: "positive" | "neutral" | "negative";
  topics?: string[];
}

interface NewsFeedProps {
  title: string;
  items: FeedItem[];
  emptyMessage?: string;
}

const sentimentColors = {
  positive: "bg-emerald-500/20 text-emerald-400",
  neutral: "bg-blue-500/20 text-blue-400",
  negative: "bg-red-500/20 text-red-400",
};

export function NewsFeed({
  title,
  items,
  emptyMessage = "No items yet",
}: NewsFeedProps) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--card-border)]">
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">{title}</h3>
      </div>
      <div className="divide-y divide-[var(--card-border)]">
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[var(--text-secondary)]">
            {emptyMessage}
          </p>
        ) : (
          items.map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-5 py-3.5 hover:bg-[var(--card-hover)] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] leading-snug line-clamp-2">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-[var(--text-secondary)]">{item.source}</span>
                    <span className="text-xs text-[var(--text-secondary)]">&middot;</span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {item.publishedAt}
                    </span>
                    {item.sentiment && (
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full",
                          sentimentColors[item.sentiment]
                        )}
                      >
                        {item.sentiment}
                      </span>
                    )}
                  </div>
                  {item.topics && item.topics.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {item.topics.map((topic) => (
                        <span
                          key={topic}
                          className="text-xs px-2 py-0.5 rounded-full bg-[var(--tag-bg)] text-[var(--text-secondary)]"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ExternalLink size={14} className="text-[var(--text-secondary)] shrink-0 mt-1" />
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}

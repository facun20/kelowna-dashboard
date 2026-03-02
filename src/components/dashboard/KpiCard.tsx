"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "flat";
  href?: string;
}

export function KpiCard({ label, value, change, changeLabel, trend, href }: KpiCardProps) {
  const trendColor =
    trend === "up"
      ? "text-[var(--accent-positive)]"
      : trend === "down"
      ? "text-[var(--accent-negative)]"
      : "text-[var(--text-secondary)]";

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const content = (
    <>
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className="text-2xl font-semibold text-[var(--text-primary)]">{value}</span>
      {change !== undefined ? (
        <div className={cn("flex items-center gap-1 text-sm", trendColor)}>
          <TrendIcon size={14} />
          <span>
            {change >= 0 ? "+" : ""}
            {change.toFixed(1)}%
          </span>
          {changeLabel && (
            <span className="text-[var(--text-secondary)] ml-1">{changeLabel}</span>
          )}
        </div>
      ) : changeLabel ? (
        <span className="text-sm text-[var(--text-secondary)]">{changeLabel}</span>
      ) : null}
    </>
  );

  const baseClass =
    "bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 flex flex-col gap-1 min-w-[180px]";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          baseClass,
          "hover:border-[var(--accent-blue)]/40 hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
        )}
      >
        {content}
      </Link>
    );
  }

  return <div className={baseClass}>{content}</div>;
}

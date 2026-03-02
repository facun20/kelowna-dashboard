"use client";

import { useEffect, useState } from "react";
import { Waves, Thermometer, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface WaterData {
  available: boolean;
  stationName?: string;
  current?: {
    level: number;
    datetime: string;
    unit: string;
  };
  change24h?: number | null;
  percentInRange?: number;
  gaugeMax?: number;
  gaugeMin?: number;
  sparkline?: { time: string; level: number }[];
  waterTemp?: {
    current: number;
    unit: string;
    sparkline: { time: string; temp: number }[];
  } | null;
  message?: string;
}

function getLevelLabel(pct: number): string {
  if (pct >= 85) return "Very High";
  if (pct >= 65) return "High";
  if (pct >= 40) return "Normal";
  if (pct >= 20) return "Low";
  return "Very Low";
}

function getLevelColor(pct: number): string {
  if (pct >= 85) return "#ef4444"; // red — flood risk
  if (pct >= 65) return "#3b82f6"; // blue — high
  if (pct >= 40) return "#22c55e"; // green — normal
  if (pct >= 20) return "#f59e0b"; // amber — low
  return "#ef4444"; // red — drought
}

export function OkanaganLakeWidget() {
  const [data, setData] = useState<WaterData | null>(null);

  useEffect(() => {
    fetch("/api/data/water-level")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data?.available) {
    return (
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Waves size={16} className="text-blue-500" />
          <p className="text-xs font-medium text-[var(--text-secondary)]">Okanagan Lake</p>
        </div>
        <p className="text-xs text-[var(--text-tertiary)]">
          {data?.message ?? "Water level data unavailable"}
        </p>
      </div>
    );
  }

  const levelChange = data.change24h;
  const changeDirection = !levelChange
    ? "flat"
    : levelChange > 0
    ? "up"
    : levelChange < 0
    ? "down"
    : "flat";

  const pct = data.percentInRange ?? 50;
  const levelLabel = getLevelLabel(pct);
  const levelColor = getLevelColor(pct);

  // Build mini sparkline SVG
  const sparkline = data.sparkline ?? [];
  let sparkSvg: string | null = null;
  if (sparkline.length > 2) {
    const levels = sparkline.map((s) => s.level);
    const minL = Math.min(...levels);
    const maxL = Math.max(...levels);
    const range = maxL - minL || 0.01;
    const w = 200;
    const h = 40;
    const points = levels
      .map((l, i) => {
        const x = (i / (levels.length - 1)) * w;
        const y = h - ((l - minL) / range) * (h - 4) - 2;
        return `${x},${y}`;
      })
      .join(" ");
    sparkSvg = points;
  }

  const readingTime = data.current?.datetime
    ? new Date(data.current.datetime).toLocaleString("en-CA", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Waves size={16} className="text-blue-500" />
        <p className="text-xs font-medium text-[var(--text-secondary)]">Okanagan Lake Level</p>
      </div>

      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              {data.current?.level?.toFixed(2)}
            </span>
            <span className="text-sm text-[var(--text-secondary)]">m</span>
          </div>
          {readingTime && (
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{readingTime}</p>
          )}
        </div>

        <div className="text-right">
          <span
            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${levelColor}15`, color: levelColor }}
          >
            {levelLabel}
          </span>
          {levelChange !== null && levelChange !== undefined && (
            <div
              className={`flex items-center justify-end gap-0.5 mt-1 text-xs ${
                changeDirection === "up"
                  ? "text-blue-500"
                  : changeDirection === "down"
                  ? "text-amber-500"
                  : "text-[var(--text-tertiary)]"
              }`}
            >
              {changeDirection === "up" ? (
                <TrendingUp size={10} />
              ) : changeDirection === "down" ? (
                <TrendingDown size={10} />
              ) : (
                <Minus size={10} />
              )}
              {levelChange > 0 ? "+" : ""}
              {levelChange.toFixed(3)}m/24h
            </div>
          )}
        </div>
      </div>

      {/* Level gauge bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[var(--text-tertiary)]">Low</span>
          <span className="text-[var(--text-tertiary)]">High</span>
        </div>
        <div className="w-full h-2 bg-[var(--surface)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: levelColor }}
          />
        </div>
      </div>

      {/* Mini sparkline */}
      {sparkSvg && (
        <div className="border-t border-[var(--card-border)] pt-3">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">Last 48 hours</p>
          <svg viewBox="0 0 200 40" className="w-full h-8" preserveAspectRatio="none">
            <polyline
              points={sparkSvg}
              fill="none"
              stroke={levelColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Water temperature */}
      {data.waterTemp && (
        <div className="border-t border-[var(--card-border)] pt-3 mt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Thermometer size={12} className="text-orange-400" />
              <span className="text-xs text-[var(--text-secondary)]">Water Temp</span>
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {data.waterTemp.current.toFixed(1)}{data.waterTemp.unit}
            </span>
          </div>
          {/* Temp sparkline */}
          {data.waterTemp.sparkline.length > 2 && (() => {
            const temps = data.waterTemp!.sparkline.map((s) => s.temp);
            const minT = Math.min(...temps);
            const maxT = Math.max(...temps);
            const rng = maxT - minT || 0.5;
            const w = 200;
            const h = 24;
            const pts = temps
              .map((t, i) => {
                const x = (i / (temps.length - 1)) * w;
                const y = h - ((t - minT) / rng) * (h - 4) - 2;
                return `${x},${y}`;
              })
              .join(" ");
            return (
              <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-5 mt-1" preserveAspectRatio="none">
                <polyline
                  points={pts}
                  fill="none"
                  stroke="#fb923c"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            );
          })()}
        </div>
      )}

      <p className="text-xs text-[var(--text-tertiary)] mt-2">
        Source: Environment Canada · Kelowna gauge
      </p>
    </div>
  );
}

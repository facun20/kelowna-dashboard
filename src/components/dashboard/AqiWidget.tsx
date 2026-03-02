"use client";

import { useEffect, useState } from "react";
import { Wind } from "lucide-react";

interface AqiData {
  available: boolean;
  aqi?: number;
  level?: string;
  color?: string;
  dominantPollutant?: string;
  time?: string;
  stationName?: string;
  message?: string;
}

export function AqiWidget() {
  const [data, setData] = useState<AqiData | null>(null);

  useEffect(() => {
    fetch("/api/data/aqi")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data?.available) {
    return (
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Wind size={16} className="text-[var(--text-secondary)]" />
          <p className="text-xs font-medium text-[var(--text-secondary)]">Air Quality</p>
        </div>
        <p className="text-xs text-[var(--text-tertiary)]">
          {data?.message ?? "AQI data unavailable"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Wind size={16} className="text-[var(--text-secondary)]" />
        <p className="text-xs font-medium text-[var(--text-secondary)]">Air Quality Index</p>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${data.color}20` }}
        >
          <span
            className="text-xl font-bold"
            style={{ color: data.color }}
          >
            {data.aqi}
          </span>
        </div>

        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{data.level}</p>
          {data.dominantPollutant && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Dominant: {data.dominantPollutant.toUpperCase()}
            </p>
          )}
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            {data.stationName}
          </p>
        </div>
      </div>
    </div>
  );
}

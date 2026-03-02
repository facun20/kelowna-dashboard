"use client";

import { useEffect, useState } from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Wind,
  Droplets,
  Thermometer,
} from "lucide-react";

interface WeatherData {
  available: boolean;
  tempC: number;
  feelsLikeC: number;
  humidity: number;
  windKmh: number;
  description: string;
  weatherCode: string;
  forecast: {
    date: string;
    maxTemp: number;
    minTemp: number;
    description: string;
    weatherCode: string;
  }[];
}

function getWeatherIcon(code: string, size = 24) {
  const c = parseInt(code, 10);
  if (c === 113) return <Sun size={size} className="text-yellow-400" />;
  if (c === 116 || c === 119) return <Cloud size={size} className="text-gray-400" />;
  if (c === 122) return <Cloud size={size} className="text-gray-500" />;
  if ([176, 263, 266, 293, 296].includes(c)) return <CloudDrizzle size={size} className="text-blue-300" />;
  if ([299, 302, 305, 308, 356, 359].includes(c)) return <CloudRain size={size} className="text-blue-400" />;
  if ([200, 386, 389, 392, 395].includes(c)) return <CloudLightning size={size} className="text-yellow-500" />;
  if ([179, 182, 185, 227, 230, 311, 314, 317, 320, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377].includes(c))
    return <CloudSnow size={size} className="text-sky-200" />;
  if ([143, 248, 260].includes(c)) return <CloudFog size={size} className="text-gray-400" />;
  return <Cloud size={size} className="text-gray-400" />;
}

function getDayName(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-CA", { weekday: "short" });
}

export function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const r = await fetch("/api/data/weather");
          const json = await r.json();
          if (!cancelled && json.available) { setData(json); return; }
        } catch { /* retry */ }
        if (attempt < 2) await new Promise((r) => setTimeout(r, 2000));
      }
      if (!cancelled) setData(null);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (!data?.available) {
    return (
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
        <p className="text-xs text-[var(--text-secondary)]">Weather data unavailable</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-[var(--text-secondary)] mb-1">Kelowna Weather</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-[var(--text-primary)]">{data.tempC}°</span>
            <span className="text-sm text-[var(--text-secondary)]">C</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">{data.description}</p>
        </div>
        <div className="mt-1">{getWeatherIcon(data.weatherCode, 36)}</div>
      </div>

      <div className="flex gap-4 text-xs text-[var(--text-secondary)] mb-3 border-t border-[var(--card-border)] pt-3">
        <span className="flex items-center gap-1">
          <Thermometer size={12} /> Feels {data.feelsLikeC}°
        </span>
        <span className="flex items-center gap-1">
          <Droplets size={12} /> {data.humidity}%
        </span>
        <span className="flex items-center gap-1">
          <Wind size={12} /> {data.windKmh} km/h
        </span>
      </div>

      {data.forecast.length > 0 && (
        <div className="grid grid-cols-3 gap-2 border-t border-[var(--card-border)] pt-3">
          {data.forecast.map((day) => (
            <div key={day.date} className="text-center">
              <p className="text-xs text-[var(--text-secondary)] mb-1">{getDayName(day.date)}</p>
              <div className="flex justify-center mb-1">
                {getWeatherIcon(day.weatherCode, 18)}
              </div>
              <p className="text-xs text-[var(--text-primary)]">
                {day.maxTemp}° <span className="text-[var(--text-tertiary)]">{day.minTemp}°</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

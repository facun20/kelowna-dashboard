import { NextResponse } from "next/server";

/**
 * Okanagan Lake water level + temperature data.
 * Station: 08NM083 (Okanagan Lake at Kelowna)
 *
 * Water level: Environment Canada OGC API (5-min intervals)
 * Water temp:  Wateroffice CSV web service, parameter 5 (hourly)
 */

const STATION = "08NM083"; // Okanagan Lake at Kelowna (active station)
const API_URL = `https://api.weather.gc.ca/collections/hydrometric-realtime/items?f=json&STATION_NUMBER=${STATION}&sortby=-DATETIME&limit=168`; // ~7 days of 5-min readings

interface HydrometricFeature {
  properties: {
    STATION_NUMBER: string;
    STATION_NAME: string;
    DATETIME: string;
    LEVEL: number | null;
    DISCHARGE: number | null;
  };
}

interface ApiResponse {
  features: HydrometricFeature[];
}

/**
 * Fetch water temperature from Wateroffice CSV endpoint (parameter 5).
 * Returns hourly readings for the last 7 days.
 */
async function fetchWaterTemperature(): Promise<{
  current: number | null;
  sparkline: { time: string; temp: number }[];
}> {
  try {
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 86400000);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} 00:00:00`;

    const url = `https://wateroffice.ec.gc.ca/services/real_time_data/csv/inline?stations[]=${STATION}&parameters[]=5&start_date=${encodeURIComponent(fmt(start))}&end_date=${encodeURIComponent(fmt(end))}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return { current: null, sparkline: [] };

    const text = await res.text();
    const lines = text.trim().split("\n").slice(1); // skip header

    const readings: { time: string; temp: number }[] = [];
    for (const line of lines) {
      const parts = line.split(",");
      if (parts.length < 4) continue;
      const datetime = parts[1]; // ISO datetime
      const value = parseFloat(parts[3]);
      if (!isNaN(value) && datetime) {
        readings.push({ time: datetime, temp: value });
      }
    }

    const current = readings.length > 0 ? readings[readings.length - 1].temp : null;

    // Take last 48 hourly readings for sparkline
    const sparkline = readings.slice(-48);

    return { current, sparkline };
  } catch {
    return { current: null, sparkline: [] };
  }
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Fetch water level and temperature in parallel
    const [levelRes, tempData] = await Promise.all([
      (async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const r = await fetch(API_URL, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "KelownaCivicDashboard/1.0",
          },
        });
        clearTimeout(timeout);
        return r;
      })(),
      fetchWaterTemperature(),
    ]);

    const res = levelRes;

    if (!res.ok) {
      return NextResponse.json(
        { available: false, message: `API returned ${res.status}` },
        { status: 200 }
      );
    }

    const data: ApiResponse = await res.json();

    if (!data.features || data.features.length === 0) {
      return NextResponse.json(
        { available: false, message: "No water level data available" },
        { status: 200 }
      );
    }

    // Get readings with valid LEVEL values, sorted newest first
    const readings = data.features
      .filter((f) => f.properties.LEVEL !== null)
      .map((f) => ({
        datetime: f.properties.DATETIME,
        level: f.properties.LEVEL as number,
      }));

    if (readings.length === 0) {
      return NextResponse.json(
        { available: false, message: "No level readings in data" },
        { status: 200 }
      );
    }

    const latest = readings[0];
    const stationName = data.features[0]?.properties.STATION_NAME ?? "Okanagan Lake";

    // Find level 24h ago for comparison
    const oneDayAgo = new Date(new Date(latest.datetime).getTime() - 86400000);
    const reading24hAgo = readings.find(
      (r) => new Date(r.datetime).getTime() <= oneDayAgo.getTime()
    );

    // Build a simplified hourly series for sparkline (last 48 readings max)
    const sparkline = readings
      .slice(0, 48)
      .reverse()
      .map((r) => ({
        time: r.datetime,
        level: r.level,
      }));

    // Okanagan Lake gauge context at Kelowna (station 08NM083)
    // Gauge datum — readings are relative to the station datum, not geodetic
    // Typical annual range: ~0.8m (winter low) to ~2.0m (spring high)
    // Flood level: ~2.4m gauge, drought: ~0.5m gauge
    const gaugeMax = 2.4;  // approximate high range
    const gaugeMin = 0.5;  // approximate low range
    const gaugeRange = gaugeMax - gaugeMin;
    const percentInRange = Math.max(
      0,
      Math.min(100, ((latest.level - gaugeMin) / gaugeRange) * 100)
    );

    return NextResponse.json({
      available: true,
      stationName,
      stationId: STATION,
      current: {
        level: latest.level,
        datetime: latest.datetime,
        unit: "m",
      },
      change24h: reading24hAgo
        ? Number((latest.level - reading24hAgo.level).toFixed(3))
        : null,
      percentInRange: Number(percentInRange.toFixed(1)),
      gaugeMax,
      gaugeMin,
      sparkline,
      waterTemp: tempData.current != null
        ? {
            current: tempData.current,
            unit: "°C",
            sparkline: tempData.sparkline,
          }
        : null,
    });
  } catch (err) {
    return NextResponse.json(
      { available: false, message: `Error: ${String(err)}` },
      { status: 200 }
    );
  }
}

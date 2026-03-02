import { NextResponse } from "next/server";

/**
 * Air Quality Index — powered by Open-Meteo (free, no API key).
 * Returns US AQI, PM2.5, PM10 for Kelowna, BC.
 */
export async function GET() {
  try {
    const res = await fetch(
      "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=49.8880&longitude=-119.4960&current=pm2_5,pm10,us_aqi&timezone=America/Vancouver",
      { next: { revalidate: 1800 } } // 30 min cache
    );

    if (!res.ok) {
      return NextResponse.json(
        { available: false, error: `Open-Meteo returned ${res.status}` },
        { status: 502 }
      );
    }

    const json = await res.json();
    const current = json.current;

    if (!current || current.us_aqi == null) {
      return NextResponse.json({
        available: false,
        error: "Open-Meteo returned no AQI data",
      });
    }

    const aqi = current.us_aqi;
    const pm25 = current.pm2_5 ?? 0;
    const pm10 = current.pm10 ?? 0;

    // Determine level and colour
    let level: string;
    let color: string;
    if (aqi <= 50) { level = "Good"; color = "#22c55e"; }
    else if (aqi <= 100) { level = "Moderate"; color = "#eab308"; }
    else if (aqi <= 150) { level = "Unhealthy for Sensitive Groups"; color = "#f97316"; }
    else if (aqi <= 200) { level = "Unhealthy"; color = "#ef4444"; }
    else if (aqi <= 300) { level = "Very Unhealthy"; color = "#a855f7"; }
    else { level = "Hazardous"; color = "#7f1d1d"; }

    // Dominant pollutant: whichever is higher relative to its WHO guideline
    const dominantPollutant = pm25 / 15 >= pm10 / 45 ? "pm2.5" : "pm10";

    return NextResponse.json(
      {
        available: true,
        aqi,
        level,
        color,
        dominantPollutant,
        time: current.time ?? null,
        stationName: "Kelowna (Open-Meteo)",
      },
      {
        headers: {
          "Cache-Control": "s-maxage=1800, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { available: false, error: String(error) },
      { status: 500 }
    );
  }
}

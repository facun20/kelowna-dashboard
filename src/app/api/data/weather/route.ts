import { NextResponse } from "next/server";

/**
 * Weather API — powered by Open-Meteo (free, no API key, highly reliable).
 * Returns current conditions + 3-day forecast for Kelowna, BC.
 * Uses WMO weather interpretation codes.
 */

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "Clear",
  1: "Mostly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Heavy Drizzle",
  56: "Freezing Drizzle",
  57: "Heavy Freezing Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  66: "Freezing Rain",
  67: "Heavy Freezing Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  77: "Snow Grains",
  80: "Light Showers",
  81: "Showers",
  82: "Heavy Showers",
  85: "Light Snow Showers",
  86: "Heavy Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm with Hail",
  99: "Severe Thunderstorm",
};

export async function GET() {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?" +
        "latitude=49.888&longitude=-119.496" +
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
        "&timezone=America/Vancouver&forecast_days=3",
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json(
        { available: false, error: `Open-Meteo returned ${res.status}` },
        { status: 502 }
      );
    }

    const json = await res.json();
    const current = json.current;

    if (!current || current.temperature_2m == null) {
      return NextResponse.json({ available: false, error: "No current data" });
    }

    const daily = json.daily;
    const forecast = (daily?.time ?? []).slice(0, 3).map((date: string, i: number) => ({
      date,
      maxTemp: Math.round(daily.temperature_2m_max[i]),
      minTemp: Math.round(daily.temperature_2m_min[i]),
      description: WMO_DESCRIPTIONS[daily.weather_code[i]] ?? "Unknown",
      weatherCode: String(daily.weather_code[i]),
    }));

    return NextResponse.json(
      {
        available: true,
        tempC: Math.round(current.temperature_2m),
        feelsLikeC: Math.round(current.apparent_temperature),
        humidity: Math.round(current.relative_humidity_2m),
        windKmh: Math.round(current.wind_speed_10m),
        description: WMO_DESCRIPTIONS[current.weather_code] ?? "Unknown",
        weatherCode: String(current.weather_code),
        forecast,
      },
      {
        headers: {
          "Cache-Control": "s-maxage=900, stale-while-revalidate=1800",
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

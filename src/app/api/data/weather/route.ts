import { NextResponse } from "next/server";

interface WttrCurrent {
  temp_C: string;
  FeelsLikeC: string;
  humidity: string;
  windspeedKmph: string;
  weatherDesc: { value: string }[];
  weatherCode: string;
}

interface WttrForecastDay {
  date: string;
  maxtempC: string;
  mintempC: string;
  hourly: {
    weatherDesc: { value: string }[];
    weatherCode: string;
  }[];
}

interface WttrResponse {
  current_condition: WttrCurrent[];
  weather: WttrForecastDay[];
}

export async function GET() {
  try {
    const res = await fetch("https://wttr.in/Kelowna?format=j1", {
      headers: { "User-Agent": "KelownaCivicDashboard/1.0" },
      next: { revalidate: 1800 }, // 30 min cache
    });

    if (!res.ok) {
      return NextResponse.json(
        { available: false, error: `wttr.in returned ${res.status}` },
        { status: 502 }
      );
    }

    const json = (await res.json()) as WttrResponse;
    const current = json.current_condition?.[0];

    if (!current) {
      return NextResponse.json({ available: false, error: "No current data" });
    }

    const forecast = (json.weather ?? []).slice(0, 3).map((day) => ({
      date: day.date,
      maxTemp: parseInt(day.maxtempC, 10),
      minTemp: parseInt(day.mintempC, 10),
      description: day.hourly?.[4]?.weatherDesc?.[0]?.value ?? "Unknown",
      weatherCode: day.hourly?.[4]?.weatherCode ?? "116",
    }));

    return NextResponse.json(
      {
        available: true,
        tempC: parseInt(current.temp_C, 10),
        feelsLikeC: parseInt(current.FeelsLikeC, 10),
        humidity: parseInt(current.humidity, 10),
        windKmh: parseInt(current.windspeedKmph, 10),
        description: current.weatherDesc?.[0]?.value ?? "Unknown",
        weatherCode: current.weatherCode ?? "116",
        forecast,
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

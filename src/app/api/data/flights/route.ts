import { NextResponse } from "next/server";

/**
 * AviationStack API — live YLW departures & arrivals.
 * Free tier: HTTP only, 100 requests/month.
 * We make 2 calls per request (departures + arrivals) — cached 15 min.
 */
const AVIATIONSTACK_KEY = process.env.AVIATIONSTACK_KEY || "08df8f152ebb7f6f1e47c88d39af80eb";
const API_URL = `http://api.aviationstack.com/v1/flights`;

interface FlightRaw {
  flight_date: string;
  flight_status: string;
  departure: {
    airport: string;
    iata: string;
    scheduled: string;
    estimated: string | null;
    delay: number | null;
    gate: string | null;
  };
  arrival: {
    airport: string;
    iata: string;
    scheduled: string;
    estimated: string | null;
    terminal: string | null;
    gate: string | null;
  };
  airline: {
    name: string;
    iata: string;
  };
  flight: {
    number: string;
    iata: string;
  };
}

function mapFlight(f: FlightRaw, direction: "departure" | "arrival") {
  const isDep = direction === "departure";
  return {
    airline: f.airline?.name ?? "Unknown",
    airlineCode: f.airline?.iata ?? "",
    flightNumber: f.flight?.iata ?? f.flight?.number ?? "",
    // For departures show destination, for arrivals show origin
    airport: isDep ? (f.arrival?.airport ?? "Unknown") : (f.departure?.airport ?? "Unknown"),
    airportCode: isDep ? (f.arrival?.iata ?? "") : (f.departure?.iata ?? ""),
    scheduledTime: isDep ? f.departure.scheduled : f.arrival.scheduled,
    estimatedTime: isDep ? f.departure.estimated : f.arrival.estimated,
    status: f.flight_status ?? "unknown",
    delay: isDep ? f.departure.delay : null,
    gate: isDep ? f.departure.gate : f.arrival?.gate,
  };
}

export async function GET() {
  try {
    // Fetch departures and arrivals in parallel
    const [depRes, arrRes] = await Promise.all([
      fetch(`${API_URL}?${new URLSearchParams({ access_key: AVIATIONSTACK_KEY, dep_iata: "YLW", limit: "10" })}`, {
        next: { revalidate: 900 },
      }),
      fetch(`${API_URL}?${new URLSearchParams({ access_key: AVIATIONSTACK_KEY, arr_iata: "YLW", limit: "10" })}`, {
        next: { revalidate: 900 },
      }),
    ]);

    const depJson = depRes.ok ? await depRes.json() : { data: [] };
    const arrJson = arrRes.ok ? await arrRes.json() : { data: [] };

    if (depJson.error && arrJson.error) {
      return NextResponse.json({
        available: false,
        error: depJson.error?.message || arrJson.error?.message || "API error",
      });
    }

    const depFlights: FlightRaw[] = depJson.data ?? [];
    const arrFlights: FlightRaw[] = arrJson.data ?? [];

    // Process departures — sort by scheduled time, take top 5
    const departures = depFlights
      .filter((f) => f.departure?.scheduled)
      .sort((a, b) => new Date(a.departure.scheduled).getTime() - new Date(b.departure.scheduled).getTime())
      .slice(0, 5)
      .map((f) => mapFlight(f, "departure"));

    // Process arrivals — sort by scheduled time, take top 5
    const arrivals = arrFlights
      .filter((f) => f.arrival?.scheduled)
      .sort((a, b) => new Date(a.arrival.scheduled).getTime() - new Date(b.arrival.scheduled).getTime())
      .slice(0, 5)
      .map((f) => mapFlight(f, "arrival"));

    return NextResponse.json({
      available: true,
      departures,
      arrivals,
      totalDepartures: depFlights.length,
      totalArrivals: arrFlights.length,
    });
  } catch (error) {
    return NextResponse.json(
      { available: false, error: String(error) },
      { status: 500 }
    );
  }
}

"use client";

import { useEffect, useState } from "react";
import { Plane, TrendingUp, ExternalLink, PlaneTakeoff, PlaneLanding } from "lucide-react";

interface AirportData {
  available: boolean;
  latest?: {
    year: number;
    passengers: number;
    change: number | null;
  };
  ranking?: string;
}

interface FlightEntry {
  flightNumber: string;
  airportCode: string;
  scheduledTime: string;
  status: string;
}

interface FlightsData {
  available: boolean;
  departures: FlightEntry[];
  arrivals: FlightEntry[];
}

function formatPassengers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-CA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

function statusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active": return "text-green-500";
    case "landed": return "text-green-500";
    case "scheduled": return "text-[var(--text-secondary)]";
    case "cancelled": return "text-red-500";
    case "delayed": return "text-amber-500";
    default: return "text-[var(--text-tertiary)]";
  }
}

function statusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case "active": return "In Air";
    case "landed": return "Landed";
    case "scheduled": return "On Time";
    case "cancelled": return "Cancelled";
    case "delayed": return "Delayed";
    default: return status;
  }
}

function FlightRow({ f }: { f: FlightEntry }) {
  return (
    <div className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[var(--surface)]">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono font-medium text-[var(--text-primary)] shrink-0 w-14">
          {f.flightNumber}
        </span>
        <span className="text-[var(--text-secondary)] truncate">
          {f.airportCode}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[var(--text-tertiary)]">
          {formatTime(f.scheduledTime)}
        </span>
        <span className={`text-[10px] font-medium w-12 text-right ${statusColor(f.status)}`}>
          {statusLabel(f.status)}
        </span>
      </div>
    </div>
  );
}

export function AirportWidget() {
  const [data, setData] = useState<AirportData | null>(null);
  const [flights, setFlights] = useState<FlightsData | null>(null);

  useEffect(() => {
    fetch("/api/data/airport")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));

    fetch("/api/data/flights")
      .then((r) => r.json())
      .then(setFlights)
      .catch(() => setFlights(null));
  }, []);

  if (!data?.available) {
    return (
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Plane size={16} className="text-sky-500" />
          <p className="text-xs font-medium text-[var(--text-secondary)]">YLW Airport</p>
        </div>
        <p className="text-xs text-[var(--text-tertiary)]">Airport data unavailable</p>
      </div>
    );
  }

  const hasDepartures = flights?.available && flights.departures.length > 0;
  const hasArrivals = flights?.available && flights.arrivals.length > 0;

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Plane size={16} className="text-sky-500" />
          <p className="text-xs font-medium text-[var(--text-secondary)]">YLW Airport</p>
        </div>
        <a
          href="https://ylw.kelowna.ca/passengers/departures"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-[var(--accent-blue)] hover:underline shrink-0"
        >
          Full status <ExternalLink size={10} />
        </a>
      </div>

      {/* Passenger stat */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-[var(--text-primary)]">
            {data.latest ? formatPassengers(data.latest.passengers) : "—"}
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            {data.latest?.year} passengers
          </span>
        </div>
        {data.latest?.change != null && (
          <div
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
              data.latest.change >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
            }`}
          >
            <TrendingUp size={8} />
            {data.latest.change > 0 ? "+" : ""}
            {data.latest.change}%
          </div>
        )}
      </div>

      {/* Live Flights — two columns on larger cards, stacked otherwise */}
      {(hasDepartures || hasArrivals) && (
        <div className="border-t border-[var(--card-border)] pt-3 space-y-3">
          {/* Departures */}
          {hasDepartures && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <PlaneTakeoff size={11} className="text-sky-500" />
                <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Departures
                </p>
              </div>
              <div className="space-y-1">
                {flights!.departures.map((f) => (
                  <FlightRow key={`dep-${f.flightNumber}`} f={f} />
                ))}
              </div>
            </div>
          )}

          {/* Arrivals */}
          {hasArrivals && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <PlaneLanding size={11} className="text-emerald-500" />
                <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Arrivals
                </p>
              </div>
              <div className="space-y-1">
                {flights!.arrivals.map((f) => (
                  <FlightRow key={`arr-${f.flightNumber}`} f={f} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ranking footer */}
      {data.ranking && (
        <p className="text-[10px] text-[var(--text-tertiary)] mt-2 pt-2 border-t border-[var(--card-border)]">
          {data.ranking}
        </p>
      )}
    </div>
  );
}

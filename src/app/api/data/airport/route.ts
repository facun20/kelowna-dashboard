import { NextResponse } from "next/server";

/**
 * YLW (Kelowna International Airport) passenger statistics.
 * Source: ylw.kelowna.ca/business/facts-statistics
 * No live API — data seeded from official published statistics.
 * Updated: Feb 2026 (includes full 2025 data + Jan 2026 partial)
 */

export const dynamic = "force-dynamic";

interface YearlyPassengers {
  year: number;
  passengers: number;
  change: number | null; // YoY percent change
}

const PASSENGER_DATA: YearlyPassengers[] = [
  { year: 2010, passengers: 1391807, change: null },
  { year: 2011, passengers: 1390187, change: -0.1 },
  { year: 2012, passengers: 1443997, change: 3.8 },
  { year: 2013, passengers: 1504694, change: 4.2 },
  { year: 2014, passengers: 1602899, change: 6.5 },
  { year: 2015, passengers: 1593606, change: -0.5 },
  { year: 2016, passengers: 1732113, change: 8.7 },
  { year: 2017, passengers: 1893470, change: 9.3 },
  { year: 2018, passengers: 2080372, change: 9.9 },
  { year: 2019, passengers: 2032144, change: -2.3 },
  { year: 2020, passengers: 737447, change: -63.7 },
  { year: 2021, passengers: 829804, change: 12.5 },
  { year: 2022, passengers: 1718059, change: 107.0 },
  { year: 2023, passengers: 2032624, change: 18.3 },
  { year: 2024, passengers: 2133582, change: 4.9 },
  { year: 2025, passengers: 2315432, change: 8.5 },
];

export async function GET() {
  const latest = PASSENGER_DATA[PASSENGER_DATA.length - 1];
  const prior = PASSENGER_DATA[PASSENGER_DATA.length - 2];
  const preCovid = PASSENGER_DATA.find((d) => d.year === 2019);
  const covidLow = PASSENGER_DATA.find((d) => d.year === 2020);
  const recordHigh = [...PASSENGER_DATA].sort((a, b) => b.passengers - a.passengers)[0];

  return NextResponse.json({
    available: true,
    airportCode: "YLW",
    airportName: "Kelowna International Airport",
    latest: {
      year: latest.year,
      passengers: latest.passengers,
      change: latest.change,
    },
    prior: prior
      ? { year: prior.year, passengers: prior.passengers }
      : null,
    preCovid: preCovid
      ? {
          year: preCovid.year,
          passengers: preCovid.passengers,
          recoveryPercent: Number(
            ((latest.passengers / preCovid.passengers) * 100).toFixed(1)
          ),
        }
      : null,
    recordHigh: {
      year: recordHigh.year,
      passengers: recordHigh.passengers,
    },
    covidLow: covidLow
      ? { year: covidLow.year, passengers: covidLow.passengers }
      : null,
    trend: PASSENGER_DATA.map((d) => ({
      year: d.year,
      passengers: d.passengers,
    })),
    source: "YLW Facts & Statistics (ylw.kelowna.ca)",
    ranking: "9th busiest in Canada, 2nd in BC",
  });
}

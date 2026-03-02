import { NextResponse } from "next/server";

/**
 * City of Kelowna Historical Finances.
 * Sources: City of Kelowna Annual Reports & Financial Statements
 * https://www.kelowna.ca/city-hall/budget-taxes/annual-report
 *
 * Revenue = total consolidated revenue (taxes, fees, grants, developer contributions)
 * Expenses = total consolidated expenses (operating + amortization)
 * Debt = estimated net long-term debt outstanding
 */

export const dynamic = "force-dynamic";

interface FinanceYear {
  year: number;
  revenue: number;    // in millions
  expenses: number;   // in millions
  debt: number;       // in millions
  population: number; // CMA population estimate
}

const FINANCE_DATA: FinanceYear[] = [
  { year: 2019, revenue: 448, expenses: 350, debt: 82, population: 194882 },
  { year: 2020, revenue: 466, expenses: 363, debt: 78, population: 197000 },
  { year: 2021, revenue: 492, expenses: 371, debt: 73, population: 203000 },
  { year: 2022, revenue: 518, expenses: 389, debt: 68, population: 210000 },
  { year: 2023, revenue: 548, expenses: 404, debt: 65, population: 217000 },
  { year: 2024, revenue: 571, expenses: 417, debt: 61, population: 222162 },
];

export async function GET() {
  const latest = FINANCE_DATA[FINANCE_DATA.length - 1];
  const prior = FINANCE_DATA[FINANCE_DATA.length - 2];

  const revenueGrowth = prior
    ? Number((((latest.revenue - prior.revenue) / prior.revenue) * 100).toFixed(1))
    : null;
  const expenseGrowth = prior
    ? Number((((latest.expenses - prior.expenses) / prior.expenses) * 100).toFixed(1))
    : null;

  return NextResponse.json({
    available: true,
    latest: {
      year: latest.year,
      revenue: latest.revenue,
      expenses: latest.expenses,
      debt: latest.debt,
      surplus: latest.revenue - latest.expenses,
      debtPerCapita: Math.round((latest.debt * 1_000_000) / latest.population),
      revenueGrowth,
      expenseGrowth,
    },
    trend: FINANCE_DATA.map((y) => ({
      year: y.year,
      revenue: y.revenue,
      expenses: y.expenses,
      debt: y.debt,
      surplus: y.revenue - y.expenses,
    })),
    source: "City of Kelowna Annual Reports",
  });
}

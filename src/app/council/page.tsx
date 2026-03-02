"use client";

import { useEffect, useState } from "react";
import { CouncilMembers } from "@/components/dashboard/CouncilMembers";
import {
  Landmark,
  ExternalLink,
  FileText,
  BookOpen,
  ChevronRight,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

interface CouncilItem {
  id: number;
  title: string;
  itemType: string;
  department: string;
  pdfUrl: string;
  topicTags: string[];
}

interface CouncilMeeting {
  id: number;
  meetingDate: string;
  meetingType: string;
  agendaUrl: string;
  minutesUrl: string;
  items: CouncilItem[];
}

interface CouncilData {
  meetings: CouncilMeeting[];
  totalMeetings: number;
  totalItems: number;
}

/* ─── Bylaws & Policies ─────────────────────────────────────────── */

const BYLAWS_URL = "https://www.kelowna.ca/city-hall/city-government/bylaws-policies";

const BYLAW_CATEGORIES = [
  {
    name: "Zoning Bylaw",
    description: "Divides the city into residential, commercial, agricultural, and other zones",
    url: "https://www.kelowna.ca/city-hall/city-government/bylaws-policies/zoning-bylaw",
    icon: "🏗️",
  },
  {
    name: "Good Neighbour Bylaw",
    description: "Regulates nuisances, noise, and property maintenance",
    url: "https://www.kelowna.ca/city-hall/city-government/bylaws-policies/good-neighbour-bylaw",
    icon: "🏘️",
  },
  {
    name: "Sign Bylaw",
    description: "Rules for signs on public and private property",
    url: "https://www.kelowna.ca/city-hall/city-government/bylaws-policies/sign-bylaw",
    icon: "🪧",
  },
  {
    name: "Parks & Public Spaces",
    description: "Regulations for parks, hours, and access permits",
    url: "https://www.kelowna.ca/city-hall/city-government/bylaws-policies/parks-and-public-spaces-bylaw",
    icon: "🌳",
  },
  {
    name: "Council Procedure Bylaw",
    description: "Regulations for council meetings and scheduling",
    url: "https://www.kelowna.ca/city-hall/city-government/bylaws-policies/council-procedure-bylaw",
    icon: "📋",
  },
  {
    name: "Traffic Bylaw",
    description: "Traffic regulations, parking, and street use",
    url: "https://www.kelowna.ca/city-hall/city-government/bylaws-policies/traffic-bylaw",
    icon: "🚗",
  },
  {
    name: "Animal Control Bylaw",
    description: "Pet licensing, animal regulations, and enforcement",
    url: "https://www.kelowna.ca/city-hall/city-government/bylaws-policies/animal-control-and-licensing-bylaw",
    icon: "🐾",
  },
  {
    name: "Building Bylaw",
    description: "Construction permits, inspections, and building code compliance",
    url: "https://www.kelowna.ca/city-hall/city-government/bylaws-policies/building-bylaw",
    icon: "🏠",
  },
];

/* ─── Council Compensation (2025, Bylaw 7547) ────────────────── */
const COUNCIL_COMPENSATION = [
  { name: "Mayor Tom Dyas", role: "Mayor", salary: 145200, expenses2024: 15609 },
  { name: "Coun. Ron Cannan", role: "Councillor", salary: 58080, expenses2024: 5884, note: "Opted out of raise" },
  { name: "Coun. Mohini Singh", role: "Councillor", salary: 58080, expenses2024: 169 },
  { name: "Coun. Gord Lovegrove", role: "Councillor", salary: 58080, expenses2024: 5025 },
  { name: "Coun. Charlie Hodge", role: "Councillor", salary: 58080, expenses2024: 1374 },
  { name: "Coun. Maxine DeHart", role: "Councillor", salary: 58080, expenses2024: 8520 },
  { name: "Coun. Luke Stack", role: "Councillor", salary: 58080, expenses2024: 4048 },
  { name: "Coun. Rick Webber", role: "Councillor", salary: 58080, expenses2024: 225 },
  { name: "Coun. Loyal Wooldridge", role: "Councillor", salary: 58080, expenses2024: 1766, note: "Unpaid leave in 2024" },
];

/* ─── City Budget & Finances ─────────────────────────────────── */
const CITY_FINANCES = {
  budget2026: {
    total: 1_052_000_000,
    propertyTax: 216_124_348,
    taxIncrease: 4.37,
    avgHomeownerImpact: 113.26,
    firstBillion: true,
  },
  budget2025: {
    propertyTax: 203_343_357,
  },
  financials2024: {
    totalRevenue: 571_000_000,
    totalExpenses: 417_000_000,
    annualSurplus: 154_000_000,
    totalAssets: 1_020_000_000,
    totalLiabilities: 547_000_000,
    accumulatedSurplus: 2_700_000_000,
    debtPerCapita: 371,
    debtServiceRatio: 2.2,
    estLongTermDebt: 61_000_000,
    totalPayroll: 134_490_000,
    population: 165_200,
  },
};

/* ─── eSCRIBE portal for meeting agendas ─────────────────────── */
const ESCRIBE_URL = "https://kelownapublishing.escribemeetings.com/";

/**
 * Checks if a URL points to an actual document (eSCRIBE portal) vs a generic page.
 */
function isDocumentLink(url: string | null): boolean {
  if (!url) return false;
  return url.includes("escribemeetings.com");
}

function MeetingCard({ meeting, variant }: { meeting: CouncilMeeting; variant: "upcoming" | "past" }) {
  const dateStr = meeting.meetingDate
    ? new Date(meeting.meetingDate + "T12:00:00").toLocaleDateString("en-CA", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Date unknown";

  const hasAgenda = isDocumentLink(meeting.agendaUrl);
  const hasMinutes = isDocumentLink(meeting.minutesUrl);

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {variant === "upcoming" ? (
            <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] shrink-0" />
          )}
          <div>
            <h4 className="text-sm font-medium text-[var(--text-primary)]">
              {meeting.meetingType}
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {dateStr}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasAgenda && (
            <a
              href={meeting.agendaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-purple-500/10 text-purple-500 rounded-lg hover:bg-purple-500/20 transition-colors"
            >
              <FileText size={12} />
              Agenda
            </a>
          )}
          {hasMinutes && (
            <a
              href={meeting.minutesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[var(--surface)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <FileText size={12} />
              Minutes
            </a>
          )}
        </div>
      </div>

      {/* Meeting Items */}
      {meeting.items && meeting.items.length > 0 && (
        <div className="border-t border-[var(--card-border)] divide-y divide-[var(--card-border)]">
          {meeting.items.map((item) => (
            <div
              key={item.id}
              className="px-5 py-3 hover:bg-[var(--card-hover)] transition-colors"
            >
              <p className="text-sm text-[var(--text-primary)]">{item.title}</p>
              <div className="flex items-center gap-2 mt-1">
                {item.department && (
                  <span className="text-xs text-[var(--text-secondary)]">
                    {item.department}
                  </span>
                )}
                {item.topicTags?.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CouncilPage() {
  const [data, setData] = useState<CouncilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/data/council")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Council & Policy</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Loading council data...</p>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 h-32 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  const filteredMeetings = data?.meetings?.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.meetingType?.toLowerCase().includes(q) ||
      m.items?.some(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.department?.toLowerCase().includes(q)
      )
    );
  });

  const upcomingMeetings = filteredMeetings?.filter(
    (m) => m.meetingDate && m.meetingDate >= today
  )?.sort((a, b) => (a.meetingDate ?? "").localeCompare(b.meetingDate ?? ""))
    ?.slice(0, 12);

  const pastMeetings = filteredMeetings?.filter(
    (m) => !m.meetingDate || m.meetingDate < today
  )?.sort((a, b) => (b.meetingDate ?? "").localeCompare(a.meetingDate ?? ""))
    ?.slice(0, 12);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-500/10">
          <Landmark size={24} className="text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Council & Policy</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Kelowna City Council meetings, agendas, bylaws, and decisions
          </p>
        </div>
      </div>

      {/* Council Members */}
      <CouncilMembers />

      {/* ─── City Budget & Debt Overview ────────────────────────── */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={16} className="text-emerald-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            2026 City Budget & Financial Health
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-[var(--surface)] rounded-lg p-3">
            <p className="text-xs text-[var(--text-secondary)]">2026 Total Budget</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">$1.05B</p>
            <p className="text-xs text-emerald-500 mt-0.5">First time over $1B</p>
          </div>
          <div className="bg-[var(--surface)] rounded-lg p-3">
            <p className="text-xs text-[var(--text-secondary)]">Property Tax (2026)</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">$216M</p>
            <div className="flex items-center gap-1 mt-0.5">
              <TrendingUp size={10} className="text-red-400" />
              <p className="text-xs text-red-400">+4.37% increase</p>
            </div>
          </div>
          <div className="bg-[var(--surface)] rounded-lg p-3">
            <p className="text-xs text-[var(--text-secondary)]">2024 Revenue</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">$571M</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Total consolidated</p>
          </div>
          <div className="bg-[var(--surface)] rounded-lg p-3">
            <p className="text-xs text-[var(--text-secondary)]">2024 Surplus</p>
            <p className="text-lg font-bold text-emerald-500">$154M</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Revenue minus expenses</p>
          </div>
        </div>

        {/* Debt & Assets row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[var(--surface)] rounded-lg p-3">
            <p className="text-xs text-[var(--text-secondary)]">Debt Per Capita</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">$371</p>
            <div className="flex items-center gap-1 mt-0.5">
              <TrendingDown size={10} className="text-emerald-500" />
              <p className="text-xs text-emerald-500">5-year downward trend</p>
            </div>
          </div>
          <div className="bg-[var(--surface)] rounded-lg p-3">
            <p className="text-xs text-[var(--text-secondary)]">Est. Long-Term Debt</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">~$61M</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Debt service ratio: 2.2%</p>
          </div>
          <div className="bg-[var(--surface)] rounded-lg p-3">
            <p className="text-xs text-[var(--text-secondary)]">Total Assets</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">$1.02B</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Financial assets (2024)</p>
          </div>
          <div className="bg-[var(--surface)] rounded-lg p-3">
            <p className="text-xs text-[var(--text-secondary)]">Total Liabilities</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">$547M</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Incl. deferred DCCs</p>
          </div>
        </div>

        <p className="text-xs text-[var(--text-tertiary)] mt-3">
          Source: 2026 Budget (Bylaw 12639), 2024 Consolidated Financial Statements, 2024 SOFI
        </p>
      </div>

      {/* ─── Council Compensation ────────────────────────────────── */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-purple-500" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Council Compensation (2025)
            </h3>
          </div>
          <a
            href="https://www.kelowna.ca/sites/files/1/docs/city-hall/AnnualReport/sofi_2024.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-500 hover:underline flex items-center gap-1"
          >
            2024 SOFI <ExternalLink size={10} />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="text-left py-2 pr-4 text-xs text-[var(--text-secondary)] font-medium">Name</th>
                <th className="text-left py-2 px-3 text-xs text-[var(--text-secondary)] font-medium">Role</th>
                <th className="text-right py-2 px-3 text-xs text-[var(--text-secondary)] font-medium">2025 Salary</th>
                <th className="text-right py-2 px-3 text-xs text-[var(--text-secondary)] font-medium">2024 Expenses</th>
                <th className="text-left py-2 pl-3 text-xs text-[var(--text-secondary)] font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {COUNCIL_COMPENSATION.map((member) => (
                <tr key={member.name} className="border-b border-[var(--card-border)]/50">
                  <td className="py-2 pr-4 text-[var(--text-primary)] font-medium">{member.name}</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">{member.role}</td>
                  <td className="py-2 px-3 text-right text-[var(--text-primary)]">
                    ${member.salary.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right text-[var(--text-secondary)]">
                    ${member.expenses2024.toLocaleString()}
                  </td>
                  <td className="py-2 pl-3 text-xs text-[var(--text-tertiary)]">
                    {member.note ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--card-border)]">
                <td className="py-2 pr-4 font-medium text-[var(--text-primary)]" colSpan={2}>Total</td>
                <td className="py-2 px-3 text-right font-bold text-[var(--text-primary)]">
                  ${COUNCIL_COMPENSATION.reduce((s, m) => s + m.salary, 0).toLocaleString()}
                </td>
                <td className="py-2 px-3 text-right font-medium text-[var(--text-secondary)]">
                  ${COUNCIL_COMPENSATION.reduce((s, m) => s + m.expenses2024, 0).toLocaleString()}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mt-3">
          Salaries set by Bylaw 7547 (revised April 14, 2025). Raise approved in 5-4 vote on April 8, 2024.
          Total city payroll (2024): $134.5M including benefits.
        </p>
      </div>

      {/* Two-column layout: Meetings + Bylaws sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Meetings */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Search */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meetings, topics, departments..."
              className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-purple-500"
            />
            <a
              href={ESCRIBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium bg-purple-500/10 text-purple-500 rounded-lg hover:bg-purple-500/20 transition-colors shrink-0"
            >
              <ExternalLink size={12} />
              eSCRIBE Portal
            </a>
          </div>

          {/* Meetings List — split into Upcoming / Past */}
          {!filteredMeetings || filteredMeetings.length === 0 ? (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                {search
                  ? "No meetings match your search"
                  : "No council meeting data yet. Run: /api/etl/council"}
              </p>
            </div>
          ) : (
            <>
              {/* ── Upcoming ── */}
              {upcomingMeetings && upcomingMeetings.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Upcoming Meetings
                  </h3>
                  {upcomingMeetings.map((meeting) => (
                    <MeetingCard key={meeting.id} meeting={meeting} variant="upcoming" />
                  ))}
                </div>
              )}

              {/* ── Past ── */}
              {pastMeetings && pastMeetings.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mt-4">
                    Past Meetings
                  </h3>
                  {pastMeetings.map((meeting) => (
                    <MeetingCard key={meeting.id} meeting={meeting} variant="past" />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Sidebar: Bylaws & Policies */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 lg:sticky lg:top-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-purple-500" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Bylaws & Policies
                </h3>
              </div>
              <a
                href={BYLAWS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-500 hover:underline"
              >
                View All →
              </a>
            </div>

            <div className="space-y-1">
              {BYLAW_CATEGORIES.map((bylaw) => (
                <a
                  key={bylaw.name}
                  href={bylaw.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--card-hover)] transition-colors group"
                >
                  <span className="text-lg shrink-0" role="img">
                    {bylaw.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] group-hover:text-purple-500 transition-colors">
                      {bylaw.name}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] line-clamp-1">
                      {bylaw.description}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-[var(--text-tertiary)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Source info */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">About This Data</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Council meeting data is sourced from the City of Kelowna RSS feed. Meeting agendas and
          minutes are available on the{" "}
          <a
            href={ESCRIBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-500 hover:underline"
          >
            eSCRIBE meeting portal
          </a>
          . Bylaws link to the official City of Kelowna bylaws & policies page.
        </p>
      </div>
    </div>
  );
}

// ── KPI Types ──────────────────────────────────────────────────────
export interface KpiData {
  label: string;
  value: string | number;
  change?: number; // percent change
  changeLabel?: string; // e.g. "vs last year"
  trend?: "up" | "down" | "flat";
  icon?: string;
}

// ── Chart Types ────────────────────────────────────────────────────
export interface TrendPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: TrendPoint[];
  color?: string;
}

// ── Business Licence ───────────────────────────────────────────────
export interface BusinessLicence {
  id: number;
  sourceId: string;
  businessName: string;
  category: string;
  status: string;
  issueDate: string;
  address: string;
  lat: number;
  lon: number;
  neighbourhood: string;
}

// ── Building Permit ────────────────────────────────────────────────
export interface BuildingPermit {
  id: number;
  sourceId: string;
  permitType: string;
  projectValue: number;
  issueDate: string;
  address: string;
  lat: number;
  lon: number;
  description: string;
  status: string;
}

// ── Crime Stat ─────────────────────────────────────────────────────
export interface CrimeStat {
  id: number;
  year: number;
  offenceType: string;
  offenceCategory: string;
  incidents: number;
  ratePer100k: number;
  percentChange: number;
  source: string;
}

// ── News Article ───────────────────────────────────────────────────
export interface NewsArticle {
  id: number;
  source: string;
  title: string;
  url: string;
  publishedAt: string;
  topics: string[];
  sentiment: "positive" | "neutral" | "negative";
  textExcerpt: string;
}

// ── Reddit Post ────────────────────────────────────────────────────
export interface RedditPost {
  id: number;
  redditId: string;
  subreddit: string;
  title: string;
  url: string;
  selftext: string;
  createdUtc: string;
  score: number;
  numComments: number;
  topics: string[];
  sentiment: "positive" | "neutral" | "negative";
}

// ── Council Meeting ────────────────────────────────────────────────
export interface CouncilMeeting {
  id: number;
  meetingDate: string;
  meetingType: string;
  agendaUrl: string;
  minutesUrl: string;
  items: CouncilItem[];
}

export interface CouncilItem {
  id: number;
  meetingId: number;
  title: string;
  itemType: string;
  department: string;
  pdfUrl: string;
  topicTags: string[];
}

// ── Housing Stat ───────────────────────────────────────────────────
export interface HousingStat {
  id: number;
  period: string;
  metric: string;
  value: number;
  unitType: string;
  source: string;
}

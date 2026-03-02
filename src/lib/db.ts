import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath = path.join(process.cwd(), "kelowna.db");
const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
sqlite.pragma("journal_mode = WAL");

// Auto-create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS business_licences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT UNIQUE,
    business_name TEXT NOT NULL,
    category TEXT,
    status TEXT,
    issue_date TEXT,
    address TEXT,
    lat REAL,
    lon REAL,
    neighbourhood TEXT,
    raw_data TEXT,
    fetched_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS building_permits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT UNIQUE,
    permit_type TEXT,
    project_value REAL,
    issue_date TEXT,
    address TEXT,
    lat REAL,
    lon REAL,
    description TEXT,
    status TEXT,
    raw_data TEXT,
    fetched_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS council_meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_date TEXT,
    meeting_type TEXT,
    agenda_url TEXT,
    minutes_url TEXT,
    source_id TEXT UNIQUE,
    fetched_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS council_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id INTEGER,
    title TEXT,
    item_type TEXT,
    department TEXT,
    pdf_url TEXT,
    topic_tags TEXT,
    fetched_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS crime_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER,
    offence_type TEXT,
    offence_category TEXT,
    incidents INTEGER,
    rate_per_100k REAL,
    percent_change REAL,
    source TEXT
  );
  CREATE TABLE IF NOT EXISTS housing_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period TEXT,
    metric TEXT,
    value REAL,
    unit_type TEXT,
    source TEXT
  );
  CREATE TABLE IF NOT EXISTS news_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT,
    title TEXT,
    url TEXT UNIQUE,
    published_at TEXT,
    topics TEXT,
    sentiment TEXT,
    text_excerpt TEXT,
    image_url TEXT,
    fetched_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reddit_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reddit_id TEXT UNIQUE,
    subreddit TEXT,
    title TEXT,
    url TEXT,
    selftext TEXT,
    created_utc TEXT,
    score INTEGER,
    num_comments INTEGER,
    topics TEXT,
    sentiment TEXT,
    fetched_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS kpi_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_date TEXT,
    metric TEXT,
    value REAL,
    comparison_value REAL,
    comparison_period TEXT
  );
  CREATE TABLE IF NOT EXISTS business_yearly_totals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    total_licences INTEGER NOT NULL,
    percent_change REAL,
    source TEXT
  );
  CREATE TABLE IF NOT EXISTS real_estate_sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    total_sales INTEGER NOT NULL,
    median_price REAL,
    avg_price REAL,
    percent_change_sales REAL,
    percent_change_price REAL,
    source TEXT
  );
  CREATE TABLE IF NOT EXISTS real_estate_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id TEXT UNIQUE,
    address TEXT,
    city TEXT,
    property_type TEXT,
    price REAL,
    bedrooms INTEGER,
    bathrooms REAL,
    sqft INTEGER,
    lot_sqft INTEGER,
    year_built INTEGER,
    photo_url TEXT,
    listing_url TEXT,
    status TEXT,
    list_date TEXT,
    fetched_at TEXT NOT NULL
  );
`);

// ── Schema migrations for existing databases ─────────────────────────
// SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we wrap in try/catch
try { sqlite.exec(`ALTER TABLE news_articles ADD COLUMN image_url TEXT`); } catch { /* already exists */ }

export const db = drizzle(sqlite, { schema });
export { sqlite };

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const businessLicences = sqliteTable("business_licences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceId: text("source_id").unique(),
  businessName: text("business_name").notNull(),
  category: text("category"),
  status: text("status"),
  issueDate: text("issue_date"),
  address: text("address"),
  lat: real("lat"),
  lon: real("lon"),
  neighbourhood: text("neighbourhood"),
  rawData: text("raw_data"),
  fetchedAt: text("fetched_at").notNull(),
});

export const buildingPermits = sqliteTable("building_permits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceId: text("source_id").unique(),
  permitType: text("permit_type"),
  projectValue: real("project_value"),
  issueDate: text("issue_date"),
  address: text("address"),
  lat: real("lat"),
  lon: real("lon"),
  description: text("description"),
  status: text("status"),
  rawData: text("raw_data"),
  fetchedAt: text("fetched_at").notNull(),
});

export const councilMeetings = sqliteTable("council_meetings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  meetingDate: text("meeting_date"),
  meetingType: text("meeting_type"),
  agendaUrl: text("agenda_url"),
  minutesUrl: text("minutes_url"),
  sourceId: text("source_id").unique(),
  fetchedAt: text("fetched_at").notNull(),
});

export const councilItems = sqliteTable("council_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  meetingId: integer("meeting_id"),
  title: text("title"),
  itemType: text("item_type"),
  department: text("department"),
  pdfUrl: text("pdf_url"),
  topicTags: text("topic_tags"),
  fetchedAt: text("fetched_at").notNull(),
});

export const crimeStats = sqliteTable("crime_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  year: integer("year"),
  offenceType: text("offence_type"),
  offenceCategory: text("offence_category"),
  incidents: integer("incidents"),
  ratePer100k: real("rate_per_100k"),
  percentChange: real("percent_change"),
  source: text("source"),
});

export const housingStats = sqliteTable("housing_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  period: text("period"),
  metric: text("metric"),
  value: real("value"),
  unitType: text("unit_type"),
  source: text("source"),
});

export const newsArticles = sqliteTable("news_articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source"),
  title: text("title"),
  url: text("url").unique(),
  publishedAt: text("published_at"),
  topics: text("topics"),
  sentiment: text("sentiment"),
  textExcerpt: text("text_excerpt"),
  imageUrl: text("image_url"),
  fetchedAt: text("fetched_at").notNull(),
});

export const redditPosts = sqliteTable("reddit_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  redditId: text("reddit_id").unique(),
  subreddit: text("subreddit"),
  title: text("title"),
  url: text("url"),
  selftext: text("selftext"),
  createdUtc: text("created_utc"),
  score: integer("score"),
  numComments: integer("num_comments"),
  topics: text("topics"),
  sentiment: text("sentiment"),
  fetchedAt: text("fetched_at").notNull(),
});

export const kpiSnapshots = sqliteTable("kpi_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  snapshotDate: text("snapshot_date"),
  metric: text("metric"),
  value: real("value"),
  comparisonValue: real("comparison_value"),
  comparisonPeriod: text("comparison_period"),
});

export const businessYearlyTotals = sqliteTable("business_yearly_totals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  year: integer("year").notNull(),
  totalLicences: integer("total_licences").notNull(),
  percentChange: real("percent_change"),
  source: text("source"),
});

export const realEstateSales = sqliteTable("real_estate_sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  year: integer("year").notNull(),
  totalSales: integer("total_sales").notNull(),
  medianPrice: real("median_price"),
  avgPrice: real("avg_price"),
  percentChangeSales: real("percent_change_sales"),
  percentChangePrice: real("percent_change_price"),
  source: text("source"),
});

export const realEstateListings = sqliteTable("real_estate_listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  propertyId: text("property_id").unique(),
  address: text("address"),
  city: text("city"),
  propertyType: text("property_type"),
  price: real("price"),
  bedrooms: integer("bedrooms"),
  bathrooms: real("bathrooms"),
  sqft: integer("sqft"),
  lotSqft: integer("lot_sqft"),
  yearBuilt: integer("year_built"),
  photoUrl: text("photo_url"),
  listingUrl: text("listing_url"),
  status: text("status"),
  listDate: text("list_date"),
  fetchedAt: text("fetched_at").notNull(),
});
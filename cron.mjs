/**
 * Lightweight cron scheduler for production.
 * Hits the ETL API routes on localhost to trigger data refreshes.
 * Run alongside `next start` in the Docker container.
 */
import { scheduleJob } from "node-schedule";

const BASE = process.env.CRON_BASE_URL || "http://localhost:3000";

async function hit(path) {
  try {
    const res = await fetch(`${BASE}${path}`);
    const text = await res.text();
    console.log(`[cron] ${new Date().toISOString()} ${path} → ${res.status} ${text.slice(0, 200)}`);
  } catch (err) {
    console.error(`[cron] ${new Date().toISOString()} ${path} FAILED:`, err.message);
  }
}

// Business licences — daily at 6 AM UTC
scheduleJob("0 6 * * *", () => hit("/api/etl/business-licences"));

// Building permits — daily at 6 AM UTC
scheduleJob("5 6 * * *", () => hit("/api/etl/building-permits"));

// News — every 6 hours
scheduleJob("0 */6 * * *", () => hit("/api/etl/news"));

// Reddit — every 6 hours (offset by 10 min)
scheduleJob("10 */6 * * *", () => hit("/api/etl/reddit"));

// Council meetings — Tuesdays at 8 AM UTC
scheduleJob("0 8 * * 2", () => hit("/api/etl/council"));

// Crime stats — 1st of August at midnight
scheduleJob("0 0 1 8 *", () => hit("/api/etl/crime"));

// Housing stats — 15th of each month
scheduleJob("0 0 15 * *", () => hit("/api/etl/housing"));

// Real estate listings — weekly on Sunday at 3 AM
scheduleJob("0 3 * * 0", () => hit("/api/etl/listings"));

// Real estate sales — monthly on the 1st
scheduleJob("0 1 1 * *", () => hit("/api/etl/real-estate-sales"));

// Business yearly totals — monthly on the 2nd
scheduleJob("0 1 2 * *", () => hit("/api/etl/business-yearly"));

console.log(`[cron] Scheduler started. Base URL: ${BASE}`);

// Run initial ETL on startup (wait 30s for Next.js to be ready)
setTimeout(async () => {
  console.log("[cron] Running initial ETL sweep...");
  await hit("/api/etl/news");
  await hit("/api/etl/reddit");
  await hit("/api/etl/business-licences");
  await hit("/api/etl/council");
}, 30_000);

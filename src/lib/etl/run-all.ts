/**
 * Run all ETL pipelines sequentially.
 * Called automatically by instrumentation.ts on server startup.
 */
export async function runAllEtl() {
  const pipelines = [
    { name: "News (RSS)", load: () => import("./news-fetcher") },
    { name: "Reddit", load: () => import("./reddit-fetcher") },
    { name: "Council", load: () => import("./council-scraper") },
    { name: "Housing", load: () => import("./housing-stats") },
    { name: "Crime", load: () => import("./crime-stats") },
    { name: "Business Licences", load: () => import("./business-licences") },
    { name: "Business Yearly", load: () => import("./business-yearly") },
    { name: "Building Permits", load: () => import("./building-permits") },
    { name: "Real Estate Listings", load: () => import("./listings-fetcher") },
    { name: "Real Estate Sales", load: () => import("./real-estate-sales") },
  ];

  console.log("[ETL] ═══ Starting all ETL pipelines ═══");
  const startTime = Date.now();

  for (const pipeline of pipelines) {
    try {
      const mod = await pipeline.load();
      if (typeof mod.fetchAndStore === "function") {
        const result = await mod.fetchAndStore();
        console.log(`[ETL] ✓ ${pipeline.name}:`, JSON.stringify(result));
      } else {
        console.log(`[ETL] ⚠ ${pipeline.name}: no fetchAndStore() export`);
      }
    } catch (err) {
      console.error(`[ETL] ✗ ${pipeline.name} failed:`, String(err));
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[ETL] ═══ All pipelines complete (${elapsed}s) ═══`);
}

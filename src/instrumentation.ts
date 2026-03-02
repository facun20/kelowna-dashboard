/**
 * Next.js instrumentation hook.
 * Runs once when the server starts (Node.js runtime only).
 * Automatically triggers all ETL pipelines to populate the database.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Dynamic import to avoid loading ETL code in the edge runtime
    const { runAllEtl } = await import("./lib/etl/run-all");

    // Run ETL in background — don't block server startup
    console.log("[Instrumentation] Server starting — scheduling ETL run...");
    setTimeout(() => {
      runAllEtl().catch((err) =>
        console.error("[Instrumentation] ETL run failed:", err)
      );
    }, 2000); // Small delay to let the DB initialise
  }
}

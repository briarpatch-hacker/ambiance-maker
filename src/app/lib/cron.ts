import cron from "node-cron";
import { createAdminClient } from "@/app/lib/supabase/admin";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Registers a job that deletes rows from `table` where `column` is older than
 * `days`. `dateOnly` formats the cutoff as YYYY-MM-DD for DATE columns.
 *
 * Analytics logs are pruned daily rather than weekly: node-cron runs in-process
 * and does not catch up after a restart, so a missed daily run costs one day of
 * bloat instead of seven.
 */
function schedulePrune(
  schedule: string,
  label: string,
  table: string,
  column: string,
  days: number,
  dateOnly = false,
) {
  cron.schedule(schedule, async () => {
    console.log(`[cron] Running ${label} cleanup...`);
    try {
      const iso = new Date(Date.now() - days * DAY_MS).toISOString();
      const cutoff = dateOnly ? iso.slice(0, 10) : iso;
      const { error, count } = await createAdminClient()
        .from(table)
        .delete({ count: "exact" })
        .lt(column, cutoff);
      if (error) {
        console.error(`[cron] ${label} cleanup failed:`, error);
      } else {
        console.log(
          `[cron] ${label} cleanup complete. Removed ${count ?? 0} entries.`,
        );
      }
    } catch (err) {
      console.error(`[cron] ${label} cleanup unexpected error:`, err);
    }
  });
}

export default function startCronJobs() {
  // Daily at 00:05: snapshot yesterday's distinct visitors and signed-in users
  cron.schedule("5 0 * * *", async () => {
    console.log("[cron] Running daily metrics snapshot...");
    try {
      const supabase = createAdminClient();
      const yesterday = new Date(Date.now() - DAY_MS)
        .toISOString()
        .slice(0, 10);
      const { data, error } = await supabase.rpc("snapshot_daily_metrics", {
        p_date: yesterday,
      });
      if (error) {
        console.error("[cron] Daily metrics snapshot failed:", error);
      } else {
        const row = Array.isArray(data) ? data[0] : data;
        console.log(
          `[cron] Daily metrics snapshot complete for ${yesterday}: ` +
            `${row?.daily_visitors ?? "?"} visitors, ${row?.daily_active_users ?? "?"} signed-in.`,
        );
      }
    } catch (err) {
      console.error("[cron] Daily metrics snapshot unexpected error:", err);
    }
  });

  // Daily at 00:10: page_view_log dedup is per calendar day and the snapshot
  // above only reads yesterday, so anything older is never consulted again
  schedulePrune(
    "10 0 * * *",
    "page_view_log",
    "page_view_log",
    "date",
    2,
    true,
  );

  // Daily at 00:15: must match the dedup window in record_ambiance_view (3 days)
  schedulePrune(
    "15 0 * * *",
    "ambiance_view_log",
    "ambiance_view_log",
    "last_viewed",
    3,
  );

  // Daily at 00:20: drop share links not visited in 30 days
  schedulePrune("20 0 * * *", "share_hits", "share_hits", "last_seen", 30);

  // Weekly on Sunday at 03:00: delete sessions inactive for 90+ days
  schedulePrune("0 3 * * 0", "stale session", "sessions", "last_active", 90);
}

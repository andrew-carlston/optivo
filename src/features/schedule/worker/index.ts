/**
 * Schedule Worker — Cron-based (twice daily)
 *
 * Syncs schedules from external sources (Google Drive, API) to Neon.
 * Delete + insert strategy for clean state on every sync.
 * Syncs today through end of year.
 *
 * Also handles:
 * - Off day tracking (working_off='Off', null times)
 * - Break/lunch segment storage
 * - All times stored as UTC timestamptz
 * - Change detection for notifications
 *
 * Run: npx tsx src/features/schedule/worker/index.ts
 * Run specific date: npx tsx src/features/schedule/worker/index.ts 2026-04-10
 */

// TODO: Implement with Drizzle + Google Drive API
// import { db } from "@/db/client";
// import { shifts } from "@/db/schema/schedule";

console.log("Schedule worker — not yet implemented");

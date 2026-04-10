/**
 * Attendance Worker — Cron-based (every 5 min during business hours)
 *
 * Checks scheduled agents against first_seen records.
 * Classifies lateness using config-driven tiers (notified vs unnotified).
 * Assigns points, updates warnings, records history.
 *
 * Also handles:
 * - Excused agent detection (PTO, call-outs, FMLA, etc.)
 * - No-show detection (configurable delay)
 * - Point rolloff (monthly, configurable)
 * - Warning level computation (configurable thresholds)
 * - Termination flagging
 *
 * Run: npx tsx src/features/attendance/worker/index.ts
 * Run specific date: npx tsx src/features/attendance/worker/index.ts 2026-04-10
 */

// TODO: Implement with Drizzle transactions
// import { db } from "@/db/client";
// import { log, points, pointHistory, config, firstSeen } from "@/db/schema/attendance";

console.log("Attendance worker — not yet implemented");

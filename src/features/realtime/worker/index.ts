/**
 * Realtime Worker — Long-running process
 *
 * Consumes agent state events from Five9 (WebSocket) and AWS Connect (Kinesis).
 * Writes to realtime.agent_states and realtime.queue_metrics via Drizzle.
 *
 * Also handles:
 * - Agent refresh polling (30s) for duration updates
 * - Queue metrics polling (30s)
 * - Stale agent cleanup (removes offline agents from DB)
 * - Thread watchdog (heartbeat-based auto-restart)
 * - agent_first_seen recording (attendance.first_seen)
 * - State interval recording (analytics.agent_metrics)
 * - 48h cleanup for volatile tables
 *
 * Run: npx tsx src/features/realtime/worker/index.ts
 */

// TODO: Implement with @aws-sdk/client-kinesis + ws (Five9 WebSocket)
// import { db } from "@/db/client";
// import { agentStates, queueMetrics } from "@/db/schema/realtime";
// import { firstSeen } from "@/db/schema/attendance";

console.log("Realtime worker — not yet implemented");

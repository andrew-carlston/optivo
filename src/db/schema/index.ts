// ── Optivo Database Schema ──
// Each module uses its own Postgres schema (namespace)
// Named exports to avoid collisions (e.g., core.config vs attendance.config)

export * as core from "./core";
export * as hr from "./hr";
export * as attendance from "./attendance";
export * as realtime from "./realtime";
export * as schedule from "./schedule";
export * as system from "./system";
export * as analytics from "./analytics";

export * as directory from "./directory";

// Future modules:
// export * as forecast from "./forecast";
// export * as staffing from "./staffing";
// export * as cost from "./cost";

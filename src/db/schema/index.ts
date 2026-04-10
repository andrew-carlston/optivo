// ── Optivo Database Schema ──
// Each module uses its own Postgres schema (namespace)
// Drizzle manages migrations across all schemas

export * from "./core";
export * from "./hr";
export * from "./attendance";
export * from "./realtime";
export * from "./schedule";
export * from "./system";
export * from "./analytics";

// Future modules:
// export * from "./forecast";
// export * from "./staffing";
// export * from "./cost";
// export * from "./directory";
// export * from "./auth";

# Optivo Architecture

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                    Clients (Browser)                  │
│  /{company-slug}/dashboard, /realtime, /attendance    │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              Next.js App Router                      │
│  Server Actions · API Routes · Middleware            │
│  Company slug → Neon branch connection routing       │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│ Supabase Auth│ │  Drizzle │ │   Workers    │
│ Google SSO   │ │   ORM    │ │ (TypeScript) │
│ JWT Sessions │ │  Typed   │ │ Long-running │
└──────────────┘ │ Queries  │ │ + Cron jobs  │
                 └─────┬────┘ └──────┬───────┘
                       │             │
                       ▼             ▼
              ┌────────────────────────────┐
              │      Neon Postgres         │
              │   Per-company branches     │
              │                            │
              │  main (schema only)        │
              │  ├── lawnstarter           │
              │  ├── acme-corp            │
              │  └── company-n            │
              │                            │
              │  Namespaces:               │
              │  core.* hr.* attendance.*  │
              │  realtime.* schedule.*     │
              │  forecast.* staffing.*     │
              │  cost.* analytics.*        │
              │  system.*                  │
              └────────────────────────────┘
```

## Data Flow

### Realtime Agent Monitoring
```
Five9 WebSocket ──→ realtime/worker ──→ realtime.agent_states
AWS Connect Kinesis ──→ realtime/worker ──→ realtime.agent_states
                                        ──→ realtime.queue_metrics
                                        ──→ attendance.first_seen
```

### Attendance & Points
```
Cron (every 5 min) ──→ attendance/worker
  1. Fetch schedule.shifts for today
  2. Fetch attendance.first_seen for today
  3. Compare: late_min = first_seen - scheduled_start
  4. Classify using attendance.config tiers (notified vs unnotified)
  5. db.transaction:
     - INSERT attendance.log
     - INSERT attendance.point_history
     - UPDATE attendance.points (total + warning level)
  All in one atomic Drizzle transaction
```

### Schedule Sync
```
Cron (twice daily) ──→ schedule/worker
  1. Fetch from external source (Google Drive, API)
  2. Delete existing shifts for date range
  3. Insert fresh shifts (UTC timestamps)
  4. Detect changes → core.notifications
```

### Forecasting
```
Scheduled / On-demand ──→ forecast/worker
  1. Read analytics.agent_metrics (historical)
  2. Run prediction model
  3. Write forecast.predictions
  4. Compare forecast.actuals for accuracy scoring
```

## Multi-Tenancy Strategy

### Neon Branching
- `main` branch holds the shared schema (no data)
- Each company gets a branch off `main`
- Branches inherit schema, diverge on data
- Company-specific tables: migrate only on that branch

### Connection Routing
```typescript
// Middleware: slug → connection string
const company = await getCompanyBySlug(params.company);
const db = getDrizzleClient(company.neon_branch_id);
```

### Feature Flags
```typescript
// system.feature_flags per company
const hasForecasting = await db.query.featureFlags.findFirst({
  where: eq(featureFlags.key, "forecast") && eq(featureFlags.enabled, true)
});
```

## Authentication Flow

```
1. User visits /{slug}/login
2. Google SSO via Supabase Auth
3. Callback → JWT with company context
4. Middleware validates JWT + resolves slug → branch
5. All subsequent requests scoped to that branch
```

## Worker Management

Workers are TypeScript processes run alongside the Next.js app:

| Worker | Type | Frequency | Feature |
|--------|------|-----------|---------|
| realtime/worker | Long-running | Continuous | Five9 WS + Kinesis consumers |
| attendance/worker | Cron | Every 5 min | Attendance check + points |
| schedule/worker | Cron | Twice daily | Schedule sync |
| forecast/worker | Scheduled | Daily / on-demand | Demand forecasting |

All workers use the same Drizzle client and schema — one language, one codebase.

### Reliability
- Heartbeat-based watchdog (120s timeout, auto-restart)
- Stale data cleanup on every cycle
- Staleness filters for replayed events
- Atomic transactions for all point operations

## Schema Design Principles

1. **Postgres namespaces** — each module gets its own schema (`core.*`, `hr.*`, etc.)
2. **UUID primary keys** — `defaultRandom()` everywhere
3. **UTC timestamps** — all `timestamp with time zone`, display in user's timezone
4. **JSONB for flexible config** — tiers, warnings, features, custom_fields
5. **Soft deletes via `active` flag** — never hard delete business data
6. **Audit trail** — `core.audit_log` for all mutations, permanent retention
7. **Config tables** — every business rule is a database row, not hardcoded

## Compared to WFM Platform v1

| Area | v1 (wfm-platform) | v2 (Optivo) |
|------|-------------------|-------------|
| Database | Supabase Postgres (fixed) | Neon (serverless, branching) |
| Query layer | Supabase REST API (PostgREST) | Drizzle ORM (typed, transactions) |
| Tenant isolation | RLS (company_id on every table) | Neon branches (physical isolation) |
| Schema management | Manual SQL in dashboard | drizzle-kit migrations in repo |
| Workers | Python (daemon threads) | TypeScript (same language as app) |
| Config | Hardcoded → retrofitted | Config-driven from day one |
| Timestamps | Bare `time` → retrofitted UTC | UTC `timestamptz` from start |
| Folder structure | Page-based (Next.js default) | Feature-module based |
| Type safety | Runtime errors | Drizzle schema → TypeScript end-to-end |

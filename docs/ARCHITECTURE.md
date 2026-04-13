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
│  Neon Auth   │ │  Drizzle │ │   Workers    │
│ Google SSO   │ │   ORM    │ │ (TypeScript) │
│ Users in DB  │ │  Typed   │ │ Long-running │
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
1. User visits /{slug}/login or /admin/login
2. Email/password or Google SSO via Better Auth (Neon Auth)
3. Session created, cookie set (better-auth.session_token)
4. Middleware validates cookie exists (fast gate)
5. Company layout calls resolveCompanyAccess(session, company):
   a. Auto-provisions branch user (first visit)
   b. Resolves platform user on main
   c. Template precedence: platform override → platform default → branch default → super bypass
   d. Loads permissions from the right DB
6. CompanyProvider passes user + permissions to all child components
```

### User Types

- **Platform users**: created in admin panel, `core.users` on main, access companies via `user_company_access`
- **Company users**: auto-provisioned on branch on first visit, get branch's default template
- **Super users**: platform users with `is_super=true`, see all companies, full admin access

### Neon Auth Advantages
- Users stored in neon_auth.* schema — same database, no sync needed
- Queryable via Drizzle like any other table
- No external auth service dependency (no Supabase, no Clerk)
- SSO providers: Google, Microsoft, GitHub, email/password

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
| Database | Supabase Postgres (fixed instance, $25/mo) | Neon Postgres 17 (serverless, scales to zero) |
| Query layer | Supabase REST API (PostgREST, upsert quirks) | Drizzle ORM (typed, real transactions) |
| Auth | Supabase Auth (separate service, JWT hooks) | Neon Auth (users in YOUR database, no sync) |
| Tenant isolation | RLS (company_id on every table) | Neon branches (physical isolation) |
| Schema management | Manual SQL in Supabase dashboard | drizzle-kit generate + migrate in repo |
| Schema namespaces | All tables in `public` schema | Postgres schemas: core.*, hr.*, attendance.*, etc. |
| Workers | Python (daemon threads, crash silently) | TypeScript (same language, inside feature modules) |
| Config | Hardcoded → retrofitted across 6+ files | Config-driven from day one (JSONB config tables) |
| Timestamps | Bare `time` → retrofitted UTC | UTC `timestamptz` from start, per-user timezone |
| Folder structure | Page-based (Next.js default) | Feature-module based (hooks/components/actions/worker) |
| Type safety | Runtime errors, misspelled columns | Drizzle schema → TypeScript types end-to-end |
| Dev environment | None — all changes hit production | Neon branching (instant dev/staging databases) |
| Framework | Next.js 16 | Next.js 16.2.3 (latest) |
| External services | Supabase (auth + DB + storage + realtime) | Neon only (auth + DB), S3/R2 for storage |

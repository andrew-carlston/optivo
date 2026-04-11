# Optivo

WFM/HR SaaS platform — realtime monitoring, scheduling, forecasting, attendance, staff planning, cost planning.

## Branch: `main`

## Stack

- **Database**: Neon Postgres 17 (serverless, per-company branching)
- **ORM**: Drizzle (typed schema, migrations via drizzle-kit generate + migrate)
- **UI Primitives**: Radix UI (select, popover, dropdown-menu, switch, dialog, tooltip, tabs, checkbox)
- **Framework**: Next.js 16.2.3 (App Router, server actions, TypeScript strict)
- **Auth**: Neon Auth / Better Auth (Google SSO, email/password, users in your DB)
- **Language**: TypeScript everywhere (frontend + backend + workers)
- **Styling**: SCSS with CSS variable theming (3 themes × 3 modes)
- **Deploy**: TBD (EC2 or Railway)

## Architecture

```
Neon Postgres 17 (per-company branches)
    ↑
Drizzle ORM (typed schema + migrations)
    ↑
Next.js 16 App Router (server actions + API routes)
    ↑
Neon Auth / Better Auth (SSO, sessions — users in your DB)
    ↑
React frontend (feature-based modules)
```

## Neon Project

- **Project**: optivo
- **Region**: AWS US East 1 (N. Virginia)
- **Postgres**: 17
- **Neon Auth**: enabled (neon_auth schema, powered by Better Auth)

### Branches

| Branch | ID | Purpose |
|--------|----|---------|
| production (main) | `br-frosty-recipe-amuoewi8` | Schema template + company routing + super users |
| lawnstarter | `br-small-sea-amxcpb3n` | LawnStarter company data (forked from main) |

### Branch Architecture

**Main (production):**
- `core.companies` — slug → branch routing for all companies
- `core.users` — super users only (platform admins)
- `core.access_templates` + `core.template_access` — platform-level ReBAC
- All other tables present as schema template (empty)

**Company branches (e.g., lawnstarter):**
- `core.users` — that company's users
- All feature tables with company data
- `core.access_templates` — company-level ReBAC templates

**Routing flow:**
1. `/lawnstarter/login` → query `core.companies` on main → get `branch_id`
2. Connect to that Neon branch
3. All queries run on the branch

### Seeded Data

**Main:**
- Super user: `andrew.carlston@gmail.com` (is_super: true)
- Company: LawnStarter (slug: `lawnstarter`, branch_id: `br-small-sea-amxcpb3n`)

## URL Structure

```
/                               Landing page
/ui                             UI Kit preview (design system playground)
/api/auth/[...all]              Better Auth API handler
/api/company/[slug]             Company lookup (queries main branch)
/[company]/login                Company-scoped login page
/[company]/dashboard            Company-scoped pages
/[company]/directory
/[company]/realtime
/[company]/attendance
/[company]/schedule
/[company]/forecast
/[company]/staffing
/[company]/cost
/[company]/analytics
/[company]/hr
/[company]/settings
/[company]/profile
```

## Database Schemas (Postgres namespaces)

36 tables across 8 namespaces + neon_auth:

```
core.*          companies, users, config, audit_log, notifications,
                access_templates, template_access, access_resources (ReBAC)
hr.*            employees, departments, divisions, lobs, positions
attendance.*    config, log, points, point_history, first_seen, disputes
realtime.*      agent_states, queue_metrics, queue_groups, queue_members, status_mappings
schedule.*      shifts, templates, calendar_tokens
system.*        integrations, feature_flags, jobs, api_keys, webhooks
analytics.*     reports, saved_filters, agent_metrics
neon_auth.*     Managed by Neon Auth (users, sessions)
```

Future namespaces (not yet created):
```
forecast.*      Models, predictions, actuals, scenarios
staffing.*      Plans, headcount, skill groups, capacity
cost.*          Budgets, rates, actuals, labor models
directory.*     Agent profiles, columns, custom fields, system connections
```

## Project Structure

```
src/
  app/
    page.tsx                    Landing page
    layout.tsx                  Root layout (Geist font, ThemeProvider)
    globals.scss                Reset, scrollbar, selection styles
    ui/                         UI Kit preview page (design system playground)
      page.tsx
      ui-preview.scss
    api/
      auth/[...all]/route.ts    Better Auth API handler
      company/[slug]/route.ts   Company lookup (Drizzle query on main)
    [company]/                  Company-scoped routes (slug from URL)
      layout.tsx                Company context provider
      login/                    Login page (uses AuthCard component)
        page.tsx
        login.scss
      dashboard/
        page.tsx

  features/                     Feature modules (fully self-contained)
    core/
      hooks/
        use-company.ts          Fetches company config from /api/company/[slug]
      components/
      actions/
    auth/
    hr/
    directory/
    realtime/
      hooks/
      components/
      actions/
      worker/                   Long-running: Five9 WS + Kinesis consumers
    attendance/
      hooks/
      components/
      actions/
      worker/                   Cron: attendance check + points
    schedule/
      hooks/
      components/
      actions/
      worker/                   Cron: schedule sync from external sources
    forecast/
      hooks/
      components/
      actions/
      worker/                   Scheduled: demand forecasting models
    staffing/
    cost/
    analytics/

  components/ui/                Shared component library
    app-shell/                  Auto-hide header, expand toggle, sticky footer
    auth-card/                  Login/signup card (company-branded)
    badge/                      Status badges (6 variants)
    button/                     Buttons (6 variants × 4 sizes + loading)
    card/                       Cards (flat, raised, inset)
    footer/                     App footer (brand + copyright)
    header/                     App header (logo, nav, actions)
    input/                      Text inputs (icon, error, loading)
    select/                     Single select (Radix) + MultiSelect (Radix Popover)
    skeleton/                   Shimmer loading placeholders
    switch/                     Toggle switch (Radix)
    access-gate/                Permission wrapper (ReBAC placeholder)
    theme-provider/             Global theme/mode restore from localStorage

  styles/
    _tokens.scss                Spacing, typography, radius, z-index
    themes/
      index.scss                Theme imports
      _default.scss             Blue accent, slate tones
      _midnight.scss            Purple accent, indigo tones
      _ember.scss               Orange accent, warm tones

  db/
    schema/                     Drizzle schema files (one per namespace)
      core.ts                   Companies, users, ReBAC tables
      hr.ts
      attendance.ts
      realtime.ts
      schedule.ts
      system.ts
      analytics.ts
      index.ts                  Namespaced exports (core.*, hr.*, etc.)
    migrations/                 Generated by drizzle-kit
    client.ts                   Neon serverless connection + Drizzle instance

  lib/
    cn.ts                       Classname utility
    auth-client.ts              Better Auth React client (signIn, signUp, useSession)
    auth-server.ts              Better Auth server instance

  middleware.ts                 Route protection skeleton

docs/
  PHASE-PLAN.md                 10 phases in build order
  DESIGN_SYSTEM.md              Full token/variable/component reference
  ARCHITECTURE.md               System design, data flows, v1 vs v2 comparison
```

## Drizzle Commands

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Apply migrations to Neon (use node script — drizzle-kit migrate has issues with serverless driver)
DATABASE_URL=... node -e '
const {neon}=require("@neondatabase/serverless");
const fs=require("fs");
const sql=neon(process.env.DATABASE_URL);
(async()=>{
  const migration=fs.readFileSync("src/db/migrations/XXXX_name.sql","utf8");
  const stmts=migration.split("--> statement-breakpoint").map(s=>s.trim()).filter(Boolean);
  for(const s of stmts) await sql.query(s);
  console.log("Done");
})();
'

# View current schema
npx drizzle-kit studio
```

## Design System

**Read `docs/DESIGN_SYSTEM.md` before building any UI** — it has all tokens, CSS variables, component APIs, and usage examples in one place.

- SCSS only — no Tailwind, no CSS-in-JS
- Theme variables: `--bg`, `--fg`, `--surface`, `--pop`, `--pop-fg`, etc.
- `--pop` is the accent color per theme
- Shadow tokens: `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-inset`
- Card variants: `flat` (default), `raised` (elevated), `inset` (recessed)
- Components (14): Button, Card, Select, MultiSelect, Switch, Input, Badge, Skeleton, AccessGate, AppShell, Header, Footer, AuthCard, ThemeProvider
- Dropdown style: pill-shaped rows, filled circle check icons, hover border
- Skeletons: left-to-right shimmer, 2.5s cycle, deterministic widths
- All timestamps UTC in DB, displayed in user's timezone
- `cn()` utility for conditional classnames
- Preview page: `/ui`

## Key Principles

1. **Config-driven** — every rule configurable per company (points, warnings, roles, features)
2. **UTC everywhere** — all timestamps stored as `timestamptz`, timezone per user for display
3. **Feature modules** — each feature owns its schema, hooks, components, actions, worker
4. **Typed end-to-end** — Drizzle schema → TypeScript types → React components
5. **Multi-tenant via branching** — each company gets a Neon branch (data isolation without RLS)
6. **Permanent audit trail** — first_seen, point_history, audit_log never cleaned up
7. **No hardcoded thresholds** — read from config tables, settings UI for admins
8. **One language** — TypeScript for frontend, backend, and workers
9. **Transactions for mutations** — all multi-step operations use `db.transaction()`
10. **Namespaced schemas** — each module gets its own Postgres schema with grant/revoke support
11. **Shared components** — all UI from component library, no raw HTML buttons/inputs in pages
12. **ReBAC from day one** — access templates on both platform (main) and company (branch) levels

## Skills (Claude)

| Skill | Purpose |
|-------|---------|
| `/optivo-feature` | Scaffold a new feature module |
| `/optivo-schema` | Add a Drizzle table to a namespace |
| `/optivo-worker` | Create a worker inside a feature |
| `/optivo-page` | Add a company-scoped page |
| `/optivo-component` | Create a UI or feature component |
| `/optivo-action` | Create a server action with transactions |

# Optivo

WFM/HR SaaS platform — realtime monitoring, scheduling, forecasting, attendance, staff planning, cost planning.

## Branch: `main`

## Stack

- **Database**: Neon Postgres 17 (serverless, per-company branching)
- **ORM**: Drizzle (typed schema, migrations via drizzle-kit generate + migrate)
- **UI Primitives**: Radix UI (select, popover, dropdown-menu, switch, dialog, tooltip, tabs, checkbox)
- **Framework**: Next.js 16.2.3 (App Router, server actions, TypeScript strict)
- **Auth**: Better Auth v1.6 (email/password, Google SSO ready, Neon Pool adapter)
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
- `core.companies` — slug → branch routing for all companies (includes `branch_host` column)
- `core.users` — super users only (platform admins), `auth_user_id` is text (not uuid)
- `core.access_templates` + `core.template_access` + `core.access_resources` — platform-level ReBAC
- `core.field_sensitivity` + `core.template_field_overrides` — field-level sensitivity control
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
/admin/login                    Super user login (email/password)
/admin                          Company switcher (super users only)
/admin/templates                Platform template list (ReBAC)
/admin/templates/[id]           Platform template editor
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
/[company]/settings              Settings hub (sidebar layout)
/[company]/settings/org          Organization settings (stub)
/[company]/settings/points       Points & Attendance settings (stub)
/[company]/settings/integrations Integrations settings (stub)
/[company]/settings/templates    Company template list (ReBAC)
/[company]/settings/templates/[id] Company template editor
/[company]/profile
```

## Database Schemas (Postgres namespaces)

38 tables across 8 namespaces + neon_auth:

```
core.*          companies, users, config, audit_log, notifications,
                access_templates, template_access, access_resources,
                field_sensitivity, template_field_overrides (ReBAC)
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
    layout.tsx                  Root layout (Geist font, blocking theme script)
    globals.scss                Reset, scrollbar, selection styles
    ui/                         UI Kit preview page (design system playground)
      page.tsx
      ui-preview.scss
    api/
      auth/[...all]/route.ts    Better Auth API handler
      company/[slug]/route.ts   Company lookup (Drizzle query on main)
    admin/                        Super user routes
      layout.tsx                Validates super user access
      page.tsx                  Company switcher
      login/
        page.tsx                Super user login (AuthCard, no signup)
        login.scss
      templates/
        page.tsx                Platform template list
        [id]/
          page.tsx              Platform template editor
      sign-out-button.tsx       Client sign-out component
      admin.scss
    [company]/                  Company-scoped routes (slug from URL)
      layout.tsx                Auth + CompanyProvider (session → company → user → permissions via loadPermissions)
      login/                    Login page (uses AuthCard component)
        page.tsx
        login.scss
      dashboard/
        page.tsx
      realtime/
        page.tsx                Stub page
      attendance/
        page.tsx                Stub page
      schedule/
        page.tsx                Stub page
      forecast/
        page.tsx                Stub page
      directory/
        page.tsx                Stub page
      hr/
        page.tsx                Stub page
      staffing/
        page.tsx                Stub page
      cost/
        page.tsx                Stub page
      analytics/
        page.tsx                Stub page
      settings/
        layout.tsx              Settings sidebar (General, Organization,
                                Points & Attendance, Integrations, Access Templates)
        page.tsx                General settings (stub)
        org/
          page.tsx              Organization settings (stub)
        points/
          page.tsx              Points & Attendance settings (stub)
        integrations/
          page.tsx              Integrations settings (stub)
        templates/
          page.tsx              Company template list
          [id]/
            page.tsx            Company template editor
      profile/
        page.tsx                Stub page

  features/                     Feature modules (fully self-contained)
    core/
      lib/
        session.ts              Server-side: getServerSession, requireSession,
                                getCompanyBySlug, getOrCreateBranchUser,
                                getSuperUser, getAllCompanies
        access/                 ReBAC engine
          types.ts              RESOURCES (15), ACTIONS (4), SCOPE_TYPES (7),
                                SENSITIVITY_LEVELS (1-10), canSeeLevel(), permKey()
          seed.ts               52 access_resources entries, MODULE_GROUPS,
                                seedAccessResources()
          load-permissions.ts   loadPermissions(db, templateId) → PermissionMap,
                                serializePermissions/deserializePermissions (RSC boundary)
          check-access.ts       checkAccess(db, user, resource, action) → {allowed, scopeType}
          filter-by-scope.ts    filterByScope(db, scopeType, userId, ScopeColumns) → SQL WHERE,
                                handles all 7 scopes incl. recursive CTE for reports
          action-context.ts     getActionContext(companySlug) → {user, company, branchDb, isSuper}
          index.ts              Barrel export
      providers/
        company-provider.tsx    CompanyProvider context + hooks (includes permissions: PermissionMap):
                                useCompanyContext, useCurrentUser, useCurrentCompany
      hooks/
        use-company.ts          Client hook: fetches company from /api/company/[slug]
        use-access.ts           useAccess() → {canAccess, getScope, isSuper}
      components/
        company-shell.tsx       Company page wrapper (AppShell + Header + Footer + nav),
                                nav filtered by canAccess(href, "view")
        company-shell.scss
        template-list/          Template card list with CRUD, create/delete dialogs
        template-editor/        Permission grid editor:
                                3-level cascade (Master → Group → Resource),
                                Full Access toggle, column-level action toggles,
                                per-resource scope & sensitivity overrides,
                                mixed state detection, disabled inheritance display
      actions/
        template-actions.ts     getTemplates, getTemplate, createTemplate, updateTemplate,
                                savePermissions, archiveTemplate, setDefaultTemplate,
                                assignTemplateToUser
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
    avatar/                     Image + initials fallback (sm 28px, md 34px, lg 44px)
    badge/                      Status badges (6 variants)
    button/                     Buttons (6 variants × 4 sizes + loading)
    card/                       Cards (flat, raised, inset)
    footer/                     App footer (brand + copyright)
    header/                     App header (logo, nav, actions)
    input/                      Text inputs (icon, error, loading)
    notification-bell/          Bell icon + unread badge + dropdown list
    select/                     Single select (Radix) + MultiSelect (Radix Popover)
    skeleton/                   Shimmer loading placeholders
    switch/                     Toggle switch (Radix)
    theme-switcher/             Mode slider + theme picker (Radix DropdownMenu, localStorage)
    access-gate/                Permission wrapper (wired to useAccess, graceful outside CompanyProvider)

  styles/
    _tokens.scss                Spacing, typography, radius, z-index
    themes/
      index.scss                Theme imports
      _default.scss             Blue accent, slate tones
      _midnight.scss            Purple accent, indigo tones
      _ember.scss               Orange accent, warm tones

  db/
    schema/                     Drizzle schema files (one per namespace)
      core.ts                   Companies, users, ReBAC tables (access_templates w/ sensitivity_levels,
                                template_access, access_resources, field_sensitivity, template_field_overrides)
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

  middleware.ts                 Route protection (checks better-auth.session_token cookie)

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
- Components (17): Button, Card, Select, MultiSelect, Switch, Input, Badge, Skeleton, AccessGate, AppShell, Header, Footer, AuthCard, Avatar, ThemeSwitcher, NotificationBell, CompanyShell
- Dropdown style: pill-shaped rows, filled circle check icons, hover border
- Skeletons: left-to-right shimmer, 2.5s cycle, deterministic widths
- All timestamps UTC in DB, displayed in user's timezone
- `cn()` utility for conditional classnames
- Preview page: `/ui`

## Hydration / Theme Initialization

A **blocking inline script** in `src/app/layout.tsx` reads `theme`, `mode`, and `expanded` from localStorage and sets `data-theme`, `data-mode`, and `.expanded` class on `<html>` **before** React hydrates. This eliminates the flash-of-wrong-theme problem entirely.

- **No ThemeProvider component** — the blocking script replaces it
- **AppShell** no longer manages expanded state — CSS reads `html.expanded` directly
- **CompanyShell** syncs expanded state via `useEffect` (only for the toggle button icon)
- Theme/mode persistence still uses localStorage; the ThemeSwitcher component writes to it and updates DOM attributes

## Company Shell

`src/features/core/components/company-shell.tsx` wraps all company-scoped pages with AppShell + Header + Footer.

- **Nav groups** (Radix DropdownMenu): Dashboard (direct link) | Workforce (Realtime, Attendance, Schedule, Forecast) | People (Directory, HR, Staffing) | Business (Cost Planning, Analytics) | Settings (direct link)
- **Nav filtering**: items hidden when `canAccess(href, "view")` returns false (ReBAC-driven)
- **Mobile/tablet**: hamburger menu replaces nav, company name hidden (logo avatar only)
- **Header actions**: ThemeSwitcher | NotificationBell | Expand toggle | User Avatar dropdown (Profile, Admin Panel for super users, Sign Out)
- Expand button is a header action (not internal to AppShell)

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

## ReBAC (Relationship-Based Access Control)

Template-based permission system on both platform (main) and company (branch) levels.

### Model

- **15 resources** across 5 module groups (Dashboard, Workforce, People, Business, Settings)
- **4 actions**: view, create, edit, archive
- **7 scope types**: all, division, department, lob, team, reports (recursive CTE), self
- **Sensitivity levels** 1–10 per resource (controls field visibility)
- **Permission key** format: `resource:action` (e.g., `attendance:edit`)

### Data Flow

```
access_templates (name, is_default, sensitivity_levels[])
    ↓
template_access (template_id, resource, action, scope_type, sensitivity_level)
    ↓
loadPermissions(db, templateId) → PermissionMap
    ↓ serialized across RSC boundary
CompanyProvider (permissions prop)
    ↓
useAccess() → { canAccess(resource, action), getScope(resource, action), isSuper }
```

### Server-Side Checks

- `checkAccess(db, user, resource, action)` → `{allowed, scopeType}` — for server actions
- `filterByScope(db, scopeType, userId, columns)` → SQL WHERE clause — for queries
- `getActionContext(companySlug)` → `{user, company, branchDb, isSuper}` — for action setup

### Template Editor

3-level cascade UI: **Master → Group → Resource**

- Master level: Full Access toggle (scope + sensitivity for all resources)
- Group level: Full Access toggle (scope + sensitivity for group resources)
- Resource level: column-level action toggles (View/Create/Edit/Archive), per-resource scope override (single select, "Default" inherits parent), per-resource sensitivity override (multi-select levels 1–10, "Default" inherits parent)
- Mixed state: parent shows "Mixed" when any child overrides the inherited value
- Disabled resources: show inherited values grayed out

### Default Template Assignment

`getOrCreateBranchUser()` assigns the company's default template (`is_default: true`) to new users automatically.

### Field Sensitivity

- `field_sensitivity` table: maps (resource, field_name) → level 1–10 + label
- `template_field_overrides` table: per-template (resource, field_name) → visible boolean
- `access_templates.sensitivity_levels`: jsonb array of allowed levels 1–10
- `canSeeLevel(allowedLevels, fieldLevel)`: returns true if the field should be visible

## Skills (Claude)

| Skill | Purpose |
|-------|---------|
| `/optivo-feature` | Scaffold a new feature module |
| `/optivo-schema` | Add a Drizzle table to a namespace |
| `/optivo-worker` | Create a worker inside a feature |
| `/optivo-page` | Add a company-scoped page |
| `/optivo-component` | Create a UI or feature component |
| `/optivo-action` | Create a server action with transactions |

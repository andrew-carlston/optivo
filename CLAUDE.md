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
| platform (admin) | `br-weathered-glade-am7hodpd` | Optivo's own internal company — slug `admin` |

### Branch Architecture

**Main (production):**
- `core.companies` — slug → branch routing for all companies (includes `branch_host` column)
- `core.users` — super users only (platform admins), `auth_user_id` is text (not uuid)
- `core.access_templates` + `core.template_access` + `core.access_resources` + `core.template_companies` — platform-level ReBAC
- `core.field_sensitivity` + `core.template_field_overrides` — field-level sensitivity control
- `core.user_company_access` — user_id, company_id, override_template_id (super user per-company access)
- `core.tags` + `core.tag_assignments` — platform tags/groups for template organization
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
- Company: Platform (slug: `admin`, branch_id: `br-weathered-glade-am7hodpd`) — Optivo's own company; routes to `/admin/*`

## URL Structure

The admin panel IS a company (slug `admin`) using the same CompanyShell as any
client app. Platform-only sections (managing other tenants, platform users, etc.)
live under `/admin/platform/*` and only show in the Settings sidebar for super users.

```
/                               Landing page
/ui                             UI Kit preview (design system playground)
/api/auth/[...all]              Better Auth API handler
/api/company/[slug]             Company lookup (queries main branch)

# Admin panel (company features for the "admin" company)
/admin/login                    Super user login
/admin                          → redirects to /admin/dashboard
/admin/dashboard                Dashboard for admin company
/admin/directory                Directory
/admin/realtime, /attendance, /schedule, /forecast   (stubs)
/admin/hr, /staffing, /cost, /analytics              (stubs)
/admin/profile
/admin/settings                 Settings hub
/admin/settings/org             Organization (5 tabs: Divisions, Departments, LOBs, Roles, Locations)
/admin/settings/directory       Directory settings (4 tabs: Columns, Employment Types, Working Statuses, Default View)
/admin/settings/integrations, /points, /templates, /templates/[id]

# Platform-only — super users via Settings sidebar
/admin/platform/companies       Tenant switcher (was /admin)
/admin/platform/users           Platform users
/admin/platform/templates       Platform access templates + /[id] editor
/admin/platform/tags            Platform tags & groups
/admin/platform/billing         Billing (stub)
/admin/platform/analytics       Platform analytics (stub)
/admin/platform/integrations    Platform integrations (stub)
/admin/platform/settings        Platform configuration (stub)

# Client company routes (e.g., /lawnstarter/*) — same shape as /admin/*
/[company]/login
/[company]/dashboard
/[company]/directory
/[company]/realtime, /attendance, /schedule, /forecast
/[company]/hr, /staffing, /cost, /analytics
/[company]/profile
/[company]/settings              Settings hub
/[company]/settings/org          Organization (5 tabs: Divisions, Departments, LOBs, Roles, Locations)
/[company]/settings/directory    Directory settings (4 tabs: Columns, Employment Types, Working Statuses, Default View)
/[company]/settings/integrations, /points, /templates, /templates/[id]
```

## Database Schemas (Postgres namespaces)

```
core.*          companies (incl. branch_host), users, user_company_access, config,
                audit_log, notifications, access_templates (incl. sensitivity_levels,
                group_name, tags), template_access, access_resources, template_companies,
                field_sensitivity, template_field_overrides (ReBAC),
                tags, tag_assignments
hr.*            divisions, lobs, departments, positions, locations,
                employees, employee_locations (M2M),
                employment_types, working_statuses
                — every org table has cost_code (flat PREFIX-LOCAL format: DIV-NA, DEPT-OPS)
                — locations have full address + is_remote + IANA timezone
                — Hierarchy: Division → LOB → Department → Position;
                  Location is parallel; Department links LOB + Location;
                  Position links Division + LOB + Department + Location
                — employment_types: Full-Time, Part-Time, Contractor, Temp, etc.
                — working_statuses: Active, On Leave, Terminated, Resigned (with color)
directory.*     columns (system + custom column registry per company),
                status_options (configurable employment statuses),
                saved_views (per-user view prefs),
                row_locks (real-time edit locks),
                pending_changes (server-side draft backup)
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
    admin/                        Admin company routes — uses CompanyShell, slug "admin"
      layout.tsx                Resolves "admin" company → CompanyProvider + CompanyShell
      page.tsx                  Redirects to /admin/dashboard
      login/page.tsx            Super user login
      dashboard, directory, hr, realtime, attendance, schedule, forecast,
      staffing, cost, analytics, profile/    Same as company-scoped pages
      settings/
        layout.tsx              SettingsShell wrapper (super-only sections appear here)
        page.tsx, org, directory, points, integrations, templates/[id]
                                Same as /[company]/settings
      platform/                 Super-only platform admin (visible via Settings sidebar)
        layout.tsx              Same SettingsShell wrapper
        companies/page.tsx      Tenant switcher (was /admin)
        users/page.tsx          Platform user management
        templates/page.tsx + [id]/page.tsx   Platform access templates
        tags/page.tsx           Platform tags
        billing, analytics, integrations, settings/page.tsx   (stubs)
    [company]/                  Company-scoped routes (slug from URL)
      layout.tsx                Auth + resolveCompanyAccess → CompanyProvider
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
          page.tsx              Organization settings (Server Component, fetches data SSR)
          loading.tsx           Skeleton fallback (Suspense boundary)
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
                                getCompanyBySlug, getPlatformUser,
                                resolveCompanyAccess (single entry point for company pages),
                                getAllCompanies, getUserCompanies
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
        company-provider.tsx    CompanyProvider context + hooks (permissions, isSuper, isPlatformUser):
                                useCompanyContext, useCurrentUser, useCurrentCompany
      hooks/
        use-company.ts          Client hook: fetches company from /api/company/[slug]
        use-access.ts           useAccess() → {canAccess, getScope, isSuper}
      components/
        company-shell.tsx       Single shell used by every company app (incl. /admin),
                                nav filtered by canAccess(href, "view"),
                                companyRoute() helper routes to /admin/* on admin company,
                                /{slug}/* otherwise; admin banner shown when isPlatformUser
                                and not on the admin company itself
        company-shell.scss
        settings-shell/         Shared sidebar shell for /admin/settings, /admin/platform,
                                and /[company]/settings — super-only sections
                                (Tenants/Access/Platform) appear when on admin company
        template-list/          Template card list with CRUD, create/delete dialogs,
                                card layout: header (title + actions) top, info below,
                                always-show groups/tags/companies sections (empty state),
                                collapsible badge sections, group-by with accent section headers
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
      actions/
        org-actions.ts          CRUD for divisions, locations, lobs, departments, positions,
                                employment_types, working_statuses — all share cost_code;
                                getOrgStructureAll batched loader (7 entity + count queries)
      components/
        org-settings/           Settings page for the org structure (5 tabs, inline data table)
          org-settings.tsx      Main component — takes companySlug + initialData from Server
                                Component page; optimistic updates + background refresh;
                                calls server actions directly (no callback prop threading)
          org-table.tsx         Data table with inline editing: click-to-edit name/cost-code,
                                inline parent dropdowns, active toggle, archive/restore;
                                draft row for adding new items; location expand row
          org-skeleton.tsx      Loading skeleton (used by loading.tsx Suspense boundary)
          _shared.ts            Tab definitions (7 tabs with prefix), helpers (toId, NONE)
          cost-code.ts          Flat PREFIX-LOCAL cost codes (DIV-NA, DEPT-OPS);
                                auto-gen with collision detection; buildFullPath for reports
          location-fields.tsx   Location form fields (country/state/city cascading dropdowns,
                                timezone auto-fill, remote toggle) — own loc-fields CSS
    directory/
      actions/
        _shared.ts, _employee-shared.ts, _lock-shared.ts   Types + helpers
        column-actions.ts       Column registry CRUD + system column seeding
        status-actions.ts       Status options CRUD + system status seeding
        view-actions.ts         Saved views CRUD
        employee-queries.ts     Employee reads (list, detail, org options)
        employee-mutations.ts   Employee writes (create, update, inline edit, archive)
        locks.ts                Row lock acquire/release/override
        pending-changes.ts      Draft backup CRUD
        page-data-actions.ts    Batched directory page loader (one auth round-trip)
        directory-actions.ts, employee-actions.ts, lock-actions.ts   Barrel re-exports
      components/               directory-table, directory-toolbar, review-sidebar,
                                pending-toast, employee-form, etc.
      components/
        directory-settings/     Settings page (Columns with reorder, Employment Types,
                                Working Statuses with color picker, Default View);
                                Server Component pages, optimistic updates, inline editing
      hooks/                    use-directory, use-draft-changes, use-directory-ws
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
    color-picker/               HSV gradient panel + hue slider + preset grid + hex input
                                (Radix Popover, themed, commits on pointer up not drag)
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
      core.ts                   Companies, users, user_company_access, ReBAC tables (access_templates w/ sensitivity_levels,
                                template_access, access_resources, template_companies,
                                field_sensitivity, template_field_overrides),
                                tags, tag_assignments
      hr.ts                     divisions, lobs, departments, positions, locations,
                                employees, employee_locations, employment_types, working_statuses
      directory.ts              columns, status_options, saved_views, row_locks, pending_changes
      attendance.ts
      realtime.ts
      schedule.ts
      system.ts
      analytics.ts
      index.ts                  Namespaced exports (core.*, hr.*, directory.*, etc.)
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
- UI primitives (16): Button, Card, Select (+ MultiSelect), Switch, Input, Badge, Skeleton, AccessGate, AppShell, Header, Footer, AuthCard, Avatar, ThemeSwitcher, NotificationBell, ColorPicker
- Feature shells: CompanyShell, SettingsShell (in `features/core/components/`, not the UI library)
  AdminShell was deleted — admin panel uses CompanyShell with the "admin" company
- Dropdown style: pill-shaped rows, filled circle check icons, hover border
- **nav-pill mixin** (`_tokens.scss`): shared `@include nav-pill` + `nav-pill-hover` + `nav-pill-active`
  for all pill-shaped interactive elements (header nav, sidebar links, dropdown items, select options)
- **Borders use `box-shadow: inset 0 0 0 1px`** instead of CSS `border` on rounded elements
  (cards, inputs, selects, nav pills) — renders smooth anti-aliased corners with `border-radius`
- Active states: text color + border only (no background fill), hover doesn't override active
- Skeletons: left-to-right shimmer, 2.5s cycle, deterministic widths
- All timestamps UTC in DB, displayed in user's timezone
- `cn()` utility for conditional classnames
- Preview page: `/ui`

## Hydration / Theme Initialization

A **blocking inline script** in `src/app/layout.tsx` reads `theme`, `mode`, and `expanded` from localStorage and sets `data-theme`, `data-mode`, and `.expanded` class on `<html>` **before** React hydrates. This eliminates the flash-of-wrong-theme problem entirely.

- **`<body>` has `suppressHydrationWarning`** — prevents Grammarly extension hydration mismatch
- **No ThemeProvider component** — the blocking script replaces it
- **AppShell** no longer manages expanded state — CSS reads `html.expanded` directly
- **CompanyShell** syncs expanded state via `useEffect` (only for the toggle button icon)
- Theme/mode persistence still uses localStorage; the ThemeSwitcher component writes to it and updates DOM attributes

## Company Shell (single shell, used for /admin and all client companies)

`src/features/core/components/company-shell.tsx` wraps every company app —
including `/admin/*` (the platform's own internal company, slug `admin`).
There is no separate AdminShell; everything goes through CompanyShell.

- **`companyRoute(href)` helper** — builds `/admin/{href}` when on the admin
  company, `/{slug}/{href}` otherwise. Lets nav items work in both contexts.
- **Admin banner**: only shown when `isPlatformUser` is true AND not currently
  on the admin company ("Admin session · Back to Admin")
- **Nav groups** (Radix DropdownMenu): Dashboard | Workforce (Realtime,
  Attendance, Schedule, Forecast) | People (Directory, HR, Staffing) | Business
  (Cost Planning, Analytics) | Settings
- **Nav filtering**: items hidden when `canAccess(href, "view")` returns false (ReBAC-driven)
- **Mobile/tablet**: hamburger menu replaces nav
- **Header actions**: ThemeSwitcher | NotificationBell | Expand toggle | User
  Avatar dropdown (Profile, Admin Panel link when platform user not on admin, Sign Out)

## Settings Shell (shared sidebar for /admin/settings, /admin/platform, /[company]/settings)

`src/features/core/components/settings-shell/settings-shell.tsx` renders the
sidebar + content layout used by both company settings and platform admin
pages. Super users on the admin company see extra sections in the sidebar:

- **Settings** (always): General, Organization, Directory, Points & Attendance,
  Integrations, Access Templates
- **Tenants** (super on admin only): Companies
- **Access** (super on admin only): Platform Users, Templates, Tags
- **Platform** (super on admin only): Billing, Analytics, Integrations, Settings

Sidebar is a sticky surface card with pill-shaped nav items using the shared
`nav-pill` mixin (`box-shadow` border on hover → `--pop` text/border on active, no bg fill).

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
13. **CSS variables for colors** — all badges use `--pop`, `--info`, `--muted-fg` (never inline hex)
14. **Select z-index above modals** — dropdowns render above dialog overlays
15. **Graceful error handling** — company layout uses try/catch for resilient loading
16. **Hard redirects on sign-out** — `window.location.href` (not `router.push`) to clear client state
17. **Skeleton loading states** — all list pages show skeleton shimmer while loading (never "Loading..." text)
18. **Login redirect skeleton** — login pages show AuthCard skeleton while redirecting after authentication
19. **Server Component pages + optimistic mutations** — pages fetch data server-side (no client waterfall), client components receive `initialData` + `companySlug`, mutations update local state instantly then background-refresh via `useTransition`
20. **Shared nav-pill mixin** — `@include nav-pill` in `_tokens.scss` for all pill-shaped interactive elements; active = text + border only, no bg fill
21. **box-shadow borders on rounded elements** — `box-shadow: inset 0 0 0 1px` instead of CSS `border` for smooth anti-aliased corners
22. **URL-persisted tab state** — tabs use `?tab=` search params so refresh/back/bookmarks restore the active tab

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
resolveCompanyAccess(session, company)
    ↓
  1. Auto-provision branch user (getOrCreateBranchUser, internal)
  2. Look up platform user (getPlatformUser)
  3. Resolve template (resolvePlatformTemplate, internal):
       override_template_id → platform access_template_id → branch access_template_id → super bypass
  4. loadPermissions(db, templateId) → PermissionMap
    ↓
CompanyProvider (user, permissions, isSuper, isPlatformUser)
    ↓
useAccess() → { canAccess(resource, action), getScope(resource, action), isSuper }
```

### Template Precedence

```
1. Platform override  (user_company_access.override_template_id) → loaded from main DB
2. Platform default   (core.users.access_template_id on main)    → loaded from main DB
3. Branch default     (core.users.access_template_id on branch)  → loaded from branch DB
4. Super user + no template anywhere                             → full bypass (isSuper=true)
5. None of the above                                             → empty permissions
```

### Server-Side Checks

- `resolveCompanyAccess(session, company)` → `{user, permissions, isSuper, isPlatformUser}` — company layout entry point
- `checkAccess(db, user, resource, action)` → `{allowed, scopeType}` — for server actions
- `filterByScope(db, scopeType, userId, columns)` → SQL WHERE clause — for queries
- `getActionContext(companySlug)` → `{user, company, branchDb, isSuper}` — for action setup (uses resolveCompanyAccess internally)

### Template Editor

3-level cascade UI: **Master → Group → Resource**

- Master level: Full Access toggle (scope + sensitivity for all resources)
- Group level: Full Access toggle (scope + sensitivity for group resources)
- Resource level: column-level action toggles (View/Create/Edit/Archive), per-resource scope override (single select, "Default" inherits parent), per-resource sensitivity override (multi-select levels 1–10, "Default" inherits parent)
- Mixed state: parent shows "Mixed" when any child overrides the inherited value
- Disabled resources: show inherited values grayed out
- Metadata: assign groups, tags, and companies via MultiSelect dropdowns

### Default Template Assignment

Branch auto-provisioning (`getOrCreateBranchUser`, internal) assigns the company's default template (`is_default: true`) to new branch users. Platform users override this via `resolvePlatformTemplate`.

### Field Sensitivity

- `field_sensitivity` table: maps (resource, field_name) → level 1–10 + label
- `template_field_overrides` table: per-template (resource, field_name) → visible boolean
- `access_templates.sensitivity_levels`: jsonb array of allowed levels 1–10
- `canSeeLevel(allowedLevels, fieldLevel)`: returns true if the field should be visible

## Platform User Access

Two types of users:
- **Platform users**: created in admin (`core.users` on main), access companies via `user_company_access`
- **Company users**: auto-provisioned on a branch on first visit, get the branch's default template

Platform users get their template from main (higher precedence than branch templates).

- `core.user_company_access` table: user_id, company_id, override_template_id
- `resolvePlatformTemplate()` (internal): resolves override → platform default → super bypass
- `is_super=true` without template = full bypass
- `is_super=true` with template = template-bound (isSuper set to false)
- Admin layout: all platform users can access admin; super-only sections gated by `isSuper`
- Admin panel nav: Companies visible to all, Users/Billing/Analytics/Settings require `isSuper`
- Company shell: platform users see accent admin banner with "Back to Admin" link

## Tags & Groups

- `core.tags` table: company_id (null = platform-level), name, color, type (tag/group), is_global
- `core.tag_assignments` table: tag_id, entity_type, entity_id
- `core.template_companies` table: template_id, company_id (direct FK, not via tags)
- Tag management page at `/admin/settings/tags` (skeleton loading, accent section headers with count badges)
- Template editor: tags, groups, and companies assignable via MultiSelect dropdowns
- Template list: filter by groups, tags, companies (all MultiSelect with search)
- Template list: Group By dropdown (none/group/tag/company) with collapsible sections, accent headers with count badges
- Template cards: always-show groups/tags/companies sections (empty state when none assigned)
- Batch loading: `getAllEntityTags(entityType)` and `getAllTemplateCompanies()` eliminate N+1 queries

## Skills (Claude)

| Skill | Purpose |
|-------|---------|
| `/optivo-feature` | Scaffold a new feature module |
| `/optivo-schema` | Add a Drizzle table to a namespace |
| `/optivo-worker` | Create a worker inside a feature |
| `/optivo-page` | Add a company-scoped page |
| `/optivo-component` | Create a UI or feature component |
| `/optivo-action` | Create a server action with transactions |

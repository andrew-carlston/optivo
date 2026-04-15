# Phase 2: Org Structure + Directory + Admin Panel

## Overview

Phase 2 builds the Directory as the central people management hub for every company, the org structure that feeds it, and a unified admin panel that's just another company app with super-only platform sections.

**Key concepts:**
- **Directory** (`/[company]/directory`) — central people table with inline editing, review workflow, row locking
- **Org structure** (`/[company]/settings/org`) — Divisions / Locations / LOBs / Departments / Positions, all with cost codes
- **Admin panel = "admin" company** — same CompanyShell as any client company, super-only sections in the Settings sidebar
- **HR module** stays as a stub for future workflows (onboarding, offboarding, compliance)

## Org Hierarchy

```
Division                                 (top-level)
  └── LOB ← division_id                  (LOB rolls up to Division)
       └── Department ← lob_id,          (Dept under LOB; can also reference Location
                       location_id,        and a parent Department for sub-departments)
                       parent_id (self-ref)
            └── Position ← department_id, lob_id, division_id, location_id
                            (Position can link to any of the four)

Location ← parent_id (self-ref)          (Hierarchical sites; can be remote)
                                         (Used as a parallel attribute on Dept/Position)
```

## Database Schema

### `hr.*` (org structure + employees)

#### `hr.divisions` — top-level org groups
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| company_id | uuid | FK |
| name | text | |
| cost_code | text | e.g., "NA" |
| active | boolean | |
| sort_order | integer | |
| created_at | timestamptz | |

#### `hr.lobs` — line of business
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| company_id | uuid | FK |
| name | text | |
| division_id | uuid | FK → hr.divisions |
| cost_code | text | e.g., "NA:S" |
| active, sort_order, created_at | | |

#### `hr.departments` — under LOB, optionally tied to Location, can have parent Dept
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| company_id | uuid | FK |
| name | text | |
| parent_id | uuid | self-ref |
| lob_id | uuid | FK → hr.lobs |
| location_id | uuid | FK → hr.locations |
| cost_code | text | e.g., "NA:R:S:T1" |
| active, sort_order, created_at | | |

#### `hr.positions` — links to Department + LOB + Division + Location
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| company_id | uuid | FK |
| name | text | |
| department_id | uuid | FK |
| lob_id | uuid | FK |
| division_id | uuid | FK |
| location_id | uuid | FK |
| cost_code | text | e.g., "NA:R:S:T1:T1A" |
| active, sort_order, created_at | | |

#### `hr.locations` — physical sites (or remote)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| company_id | uuid | FK |
| parent_id | uuid | self-ref hierarchy |
| name | text | |
| is_remote | boolean | If true, address fields are skipped |
| address_line_1, address_line_2 | text | |
| city, state_province, postal_code, country | text | ISO codes for state + country |
| timezone | text | IANA name; auto-fills from country |
| phone | text | |
| cost_code | text | |
| active, sort_order, created_at | | |

#### `hr.employee_locations` — many-to-many people ↔ locations
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| employee_id | uuid | FK |
| location_id | uuid | FK |
| is_primary | boolean | |
| created_at | timestamptz | |

#### `hr.employees` — people records
(Existing; no changes for Phase 2.)

### `directory.*` (column config + edit workflow)

| Table | Purpose |
|-------|---------|
| `directory.columns` | System + custom column registry per company; controls visibility, sensitivity, editability, search/filter capability |
| `directory.status_options` | Custom employment statuses with colors (system defaults: active, on_leave, terminated, resigned) |
| `directory.saved_views` | Per-user saved column arrangements + filters; `user_id = null` is the company default |
| `directory.row_locks` | Persistent edit locks with override request flow (60s auto-unlock) |
| `directory.pending_changes` | Server-side draft backup for the inline-edit review workflow |

## Cost Codes

Every org entity (Division, Location, LOB, Department, Position) has a `cost_code` (required at create/edit) used for financial accounting integrations.

**Auto-generation** with cascading composition:
```
Division "North America"           → NA
Location "Remote" (top-level)      → R
LOB "Support" (under NA)           → NA:S
Department "Tier 1" (under Support + Remote) → NA:R:S:T1
Position "Tier 1 Agent" (under Tier 1 dept)  → NA:R:S:T1:T1A
```

- **Cascade order** is fixed: Division → Location → LOB → Department → Position
- **Local code** is generated from the name (initials for multi-word, first 2-5 chars for single)
- **Collision detection** within siblings — tries variations before falling back to numeric suffix
- **Manual override** at any time — typing in the field stops auto-gen for that session
- **Auto-uppercase** input forces uppercase

## Admin Panel = "admin" company

The admin panel is just another company on the platform (slug `admin`, branch `br-weathered-glade-am7hodpd`). It uses the same CompanyShell, same routes, same SettingsShell. Super users see extra "Tenants / Access / Platform" sections in the Settings sidebar.

```
/admin/dashboard, /admin/directory, /admin/hr, /admin/realtime, /admin/profile, ...
/admin/settings/{general, org, directory, points, integrations, templates}
/admin/platform/{companies, users, templates, tags, billing, analytics, integrations, settings}
```

The `companyRoute()` helper in CompanyShell builds `/admin/{href}` when on the admin company, `/{slug}/{href}` otherwise — same nav code works in both contexts.

## Org Settings Page (`/[company]/settings/org`)

Tabbed UI for managing the 5 org entities. **Order: Divisions → Locations → LOBs → Departments → Positions** (matches the cascade).

Per-tab card list with:
- **Show archived toggle** — hidden by default, restorable with the ArchiveRestore button
- **Cost Code badge** on each card (`# NA:R:S:T1`)
- **Hierarchy chips** — each card shows its parent links (LOB shows Division, Department shows LOB + Location + parent Dept, Position shows all 4)

Create/Edit dialog:
- **Sticky header** with icon, title, subtitle, AND a compact Cost Code input top-right
- **Sticky footer** with Cancel + Save (no X close button — Cancel suffices)
- **Sectioned body** with field groupings (Basics / Address for locations)
- **Cost Code is required**; Save disabled until Name + Cost Code are filled
- Auto-fills as user types Name; collision-free against siblings; updates when parent dropdowns change

## Directory Page (`/[company]/directory`)

Central people table with inline editing, review workflow, real-time row locking via WebSocket.
(Implementation is in progress — see `src/features/directory/`.)

Key features built:
- Server actions split into focused files: `column-actions`, `status-actions`, `view-actions`, `employee-queries`, `employee-mutations`, `locks`, `pending-changes`, `page-data-actions` (batched loader)
- Components: `directory-table` (TanStack Table), `directory-toolbar`, `review-sidebar`, `pending-toast`, `employee-form`, `directory-settings`
- Hooks: `use-directory`, `use-draft-changes`
- WebSocket server stub at `src/ws/server.ts` for lock broadcast

## Settings Sidebar Architecture

`src/features/core/components/settings-shell/settings-shell.tsx` is the shared sidebar component used by:
- `/admin/settings/*`
- `/admin/platform/*` (super-only routes get the same sidebar treatment)
- `/[company]/settings/*`

It shows the Settings group always; the Tenants/Access/Platform groups only when `isSuper` AND on the admin company.

## File Structure

```
src/
  db/schema/
    hr.ts                        divisions, lobs, departments, positions, locations,
                                 employees, employee_locations
    directory.ts                 columns, status_options, saved_views, row_locks, pending_changes

  features/hr/
    actions/
      org-actions.ts             CRUD for all 5 org entities + getOrgStructureAll batched loader
    components/
      org-settings/
        org-settings.tsx         Main component (~750 lines — tabs, dialogs, state)
        _shared.ts               Constants (TABS, NONE, EMPTY_LOC), helpers (toId, toIdOrNull)
        cost-code.ts             Auto-gen + cascading composition
        org-cards.tsx            Per-entity card components
        location-fields.tsx      Location-specific form fields (country/state/city, timezone)
        org-settings.scss

  features/directory/
    actions/                     11 files split by concern (queries, mutations, locks, etc.)
    components/                  directory-table, toolbar, review-sidebar, pending-toast,
                                 employee-form, directory-settings, lock-indicator
    hooks/                       use-directory, use-draft-changes, use-directory-ws

  features/core/components/
    company-shell.tsx            Single shell for all company apps including /admin
    settings-shell/              Shared sidebar shell for settings + platform pages

  app/
    admin/
      layout.tsx                 Resolves "admin" company → CompanyProvider
      page.tsx                   Redirects to /admin/dashboard
      dashboard, directory, hr, ..., settings/, profile/   (mirrors /[company]/*)
      platform/
        layout.tsx               SettingsShell wrapper
        companies, users, templates/[id], tags, billing, analytics, integrations, settings
    [company]/
      settings/layout.tsx        SettingsShell wrapper
      settings/{org, directory, ...}/page.tsx
```

## Dependencies Added

| Package | Purpose |
|---------|---------|
| `@tanstack/react-table` | Headless table for the directory grid |
| `ws` | WebSocket server (Node) for row locks |
| `country-state-city` | Country/State/City cascading dropdowns in the location form |
| `@vvo/tzdb` | IANA timezone list with formatted labels |

## Migrations Applied

All on **main**, **lawnstarter**, and **platform (admin)** branches:

- `directory` schema with 5 tables
- `hr.locations`, `hr.employee_locations` tables
- `hr.locations.is_remote` boolean
- `cost_code text` on `hr.divisions / lobs / departments / positions / locations`
- `hr.lobs.division_id` (replaces `department_id`)
- `hr.departments.lob_id`, `hr.departments.location_id`
- `hr.positions.division_id`, `hr.positions.location_id`
- `core.companies.branch_host` on lawnstarter (was missing) + lawnstarter row inserted on its own branch
- `core.companies` row for the admin company on both main and its own branch

## Future Work

- Inline-edit review system in the directory (drafts → review sidebar → batch apply with row locks)
- Bulk import for employees (CSV with matching + review modal)
- BPO multi-tenant switching (one company → many client companies) — see `project_bpo_company_switching.md` memory
- HR workflows (onboarding, offboarding, compliance) at `/[company]/hr`

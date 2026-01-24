# RBAC (Role-Based Access Control) Implementation Plan

## Summary
Implement a full RBAC system in the Settings page where tenants can create and manage custom roles with granular permissions for pages, directory table/column visibility, and tag/label access. Every tenant starts with a "Super Admin" role that has full access.

---

## UI Layout Design

### Role Cards Grid (Main RBAC View)
```
+------------------------------------------------------------------+
|                    Role-Based Access Control                      |
|  Manage roles and permissions for your organization              |
|                                                    [+ New Role]   |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------+  +------------------+  +------------------+ |
|  |    [Crown]       |  |   [Shield]       |  |  [Briefcase]     | |
|  |   Super Admin    |  |     Admin        |  |    Manager       | |
|  |   System Role    |  |   12 members     |  |   24 members     | |
|  |   [View Only]    |  |   [Configure]    |  |   [Configure]    | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                   |
|  +------------------+  +------------------+                       |
|  |    [User]        |  |    [Eye]         |                       |
|  |    Employee      |  |    Viewer        |                       |
|  |  156 members     |  |   8 members      |                       |
|  |    (Default)     |  |   [Configure]    |                       |
|  |   [Configure]    |  +------------------+                       |
|  +------------------+                                             |
+------------------------------------------------------------------+
```

### Role Detail Panel (When Card Clicked)
```
+------------------------------------------------------------------+
|  [<- Back]                              Admin                     |
+------------------------------------------------------------------+
|  +---------------------------+  +-------------------------------+ |
|  | ROLE SETTINGS             |  | PERMISSIONS                   | |
|  |                           |  |                               | |
|  | Name: [Admin           ]  |  | [Pages] [Tables] [Scope] [Tags]|
|  | Description: [...]        |  +-------------------------------+ |
|  | Color: [Purple dropdown]  |  |                               | |
|  | Icon:  [Shield dropdown]  |  | PAGES TAB:                    | |
|  | Parent: [None        v]   |  | +---------------------------+ | |
|  +---------------------------+  | | [x] Dashboard             | | |
|                                 | |     [x] Analytics         | | |
|                                 | |     [x] Reports           | | |
|                                 | |     [ ] Activity          | | |
|                                 | +---------------------------+ | |
|                                 | | [x] Directory             | | |
|                                 | |     [x] List View         | | |
|                                 | |     [x] Org Chart         | | |
|                                 | |     [ ] Cards             | | |
|                                 | +---------------------------+ | |
|                                 | | [ ] Settings              | | |
|                                 | |     (views disabled)      | | |
|                                 | +---------------------------+ | |
|                                 |                               | |
+------------------------------------------------------------------+
|  Cascade: [x] To children  [x] From parent                       |
+------------------------------------------------------------------+
|           [Reset Defaults]              [Discard] [Save Changes] |
+------------------------------------------------------------------+
```

### Scope Tab (Data Visibility)
```
+------------------------------------------------------------------+
| SCOPE TAB:                                                        |
|                                                                   |
| Who can this role see in the directory?                          |
|                                                                   |
| +--------------------------------------------------------------+ |
| | ( ) Self Only                                                 | |
| |     Can only view and edit their own profile                  | |
| +--------------------------------------------------------------+ |
| | ( ) Direct Reports                                            | |
| |     Self + employees who report directly to them              | |
| +--------------------------------------------------------------+ |
| | ( ) Department                                                | |
| |     All employees in their same department                    | |
| +--------------------------------------------------------------+ |
| | (x) All Company                                               | |
| |     All employees in the organization                         | |
| +--------------------------------------------------------------+ |
|                                                                   |
| Advanced Options:                                                 |
| [x] Include indirect reports (reports of reports)                 |
| [ ] Include cross-department team members                         |
| [x] Exclude terminated employees                                  |
+------------------------------------------------------------------+
```

### Tables Tab (Column Visibility Matrix)
```
+---------------------------------------------------------------+
| TABLES TAB:                                                    |
|                                                                |
| +------------------+--------+-------+-------+-------+-------+  |
| | Table            | Visible| email | name  | phone | dept  |  |
| +------------------+--------+-------+-------+-------+-------+  |
| | Core Directory   |  [x]   |  [x]  |  [x]  |  [ ]  |  n/a  |  |
| | Personal Info    |  [x]   |  n/a  |  [x]  |  [x]  |  n/a  |  |
| | Employment       |  [x]   |  n/a  |  n/a  |  n/a  |  [x]  |  |
| | Compensation [!] |  [ ]   |  ---  |  ---  |  ---  |  ---  |  |
| | HIPAA [!!]       |  [ ]   |  ---  |  ---  |  ---  |  ---  |  |
| +------------------+--------+-------+-------+-------+-------+  |
|                                                                |
| [!] = High sensitivity   [!!] = Critical (HIPAA)               |
| --- = Disabled (table not visible)                             |
+---------------------------------------------------------------+
```

---

## Database Schema

### New Tables (in tenant schema)

**`core_rbac_roles`**
```sql
- id TEXT PRIMARY KEY
- name TEXT UNIQUE NOT NULL          -- 'super_admin', 'admin', etc.
- display_name TEXT NOT NULL         -- 'Super Admin'
- description TEXT
- color TEXT DEFAULT '#6b7280'       -- Card accent color
- icon TEXT DEFAULT 'shield'         -- crown, shield, briefcase, user, eye
- is_system_role BOOLEAN DEFAULT FALSE
- is_default BOOLEAN DEFAULT FALSE   -- Assigned to new users
- parent_role_id TEXT (FK)           -- For cascade/inheritance
- priority INTEGER DEFAULT 0         -- Higher = wins in conflicts
- created_at, updated_at TIMESTAMP
```

**`core_rbac_permissions`**
```sql
- id TEXT PRIMARY KEY
- role_id TEXT NOT NULL (FK -> core_rbac_roles)
- page_permissions JSONB             -- Page/view access
- table_permissions JSONB            -- Table/column visibility
- tag_permissions JSONB              -- Tag CRUD + visibility
- label_permissions JSONB            -- Label CRUD + visibility
- cascade_to_children BOOLEAN DEFAULT TRUE
- inherit_from_parent BOOLEAN DEFAULT TRUE
- created_at, updated_at TIMESTAMP
```

**`core_rbac_data_scope`** (NEW - Data Visibility Scoping)
```sql
- id TEXT PRIMARY KEY
- role_id TEXT NOT NULL (FK -> core_rbac_roles)
- scope_type TEXT NOT NULL             -- 'self' | 'direct_reports' | 'department' | 'all'
- scope_details JSONB                  -- Additional scope config if needed
- apply_to_tables TEXT[]               -- Which tables this scope applies to
- created_at, updated_at TIMESTAMP
```

### Data Scope Options
```
+------------------------------------------------------------------+
| DATA VISIBILITY SCOPE                                             |
|                                                                   |
| Who can this role see in the directory?                          |
|                                                                   |
| ( ) Self Only                                                     |
|     Can only view and edit their own profile                     |
|                                                                   |
| ( ) Direct Reports                                                |
|     Can view self + employees who report directly to them        |
|                                                                   |
| ( ) Department                                                    |
|     Can view all employees in their same department              |
|                                                                   |
| (x) All Company                                                   |
|     Can view all employees in the organization                   |
|                                                                   |
+------------------------------------------------------------------+
| Advanced Scope Options:                                           |
| [ ] Include indirect reports (reports of reports)                 |
| [ ] Include cross-department team members                         |
| [ ] Exclude terminated employees                                  |
+------------------------------------------------------------------+
```

### Default Super Admin (seeded on tenant creation)
```json
{
  "name": "super_admin",
  "displayName": "Super Admin",
  "description": "Full access to all features and data. Cannot be deleted.",
  "color": "#7c3aed",
  "icon": "crown",
  "isSystemRole": true,
  "permissions": {
    "pagePermissions": { "*": { "access": true, "views": { "*": true } } },
    "tablePermissions": { "*": { "visible": true, "columns": { "*": true } } },
    "tagPermissions": { "canCreate": true, "canEdit": true, "canDelete": true },
    "labelPermissions": { "canCreate": true, "canEdit": true, "canDelete": true }
  },
  "dataScope": {
    "scopeType": "all",
    "includeIndirectReports": true,
    "includeCrossDepartment": true,
    "excludeTerminated": false
  }
}
```

---

## Files to Create/Modify

### New Files
```
src/types/rbac.ts                                    # Type definitions
src/app/api/[tenant]/rbac/route.ts                   # GET/POST roles
src/app/api/[tenant]/rbac/[roleId]/route.ts          # GET/PUT/DELETE role
src/app/api/[tenant]/rbac/[roleId]/permissions/route.ts
src/app/[tenant]/settings/rbac/
  ├── components/
  │   ├── RoleCard.tsx                               # Individual role card
  │   ├── RoleCardGrid.tsx                           # Grid of all roles
  │   ├── CreateRoleModal.tsx                        # New role modal
  │   ├── RoleDetailPanel.tsx                        # Permission editor panel
  │   ├── PagePermissions.tsx                        # Page/view checkboxes
  │   ├── TablePermissions.tsx                       # Column visibility matrix
  │   ├── DataScopeSelector.tsx                      # Scope radio buttons + options
  │   └── TagLabelPermissions.tsx                    # Tag/label toggles
  ├── hooks/
  │   ├── useRbacRoles.ts                            # Fetch/manage roles
  │   └── useRolePermissions.ts                      # Fetch/update permissions
  └── constants.ts                                   # Page definitions, defaults
```

### Modify
```
src/lib/tenant-db.ts                                 # Add RBAC tables to schema
src/app/[tenant]/settings/page.tsx                   # Replace ComingSoonView
src/app/[tenant]/settings/page.module.sass           # Add RBAC styles
```

---

## Implementation Phases

### Phase 1: Foundation
1. Create `src/types/rbac.ts` with all type definitions
2. Add RBAC tables to `tenant-db.ts` createTenantDb method
3. Seed Super Admin role on tenant creation

### Phase 2: API Layer
1. Create `/api/[tenant]/rbac/route.ts` (list/create roles)
2. Create `/api/[tenant]/rbac/[roleId]/route.ts` (get/update/delete)
3. Create `/api/[tenant]/rbac/[roleId]/permissions/route.ts`

### Phase 3: Hooks
1. Create `useRbacRoles.ts` (based on useAppearanceSettings pattern)
2. Create `useRolePermissions.ts`

### Phase 4: UI - Role Cards
1. Create `RoleCard.tsx` component
2. Create `RoleCardGrid.tsx` component
3. Create `CreateRoleModal.tsx`
4. Replace "Coming Soon" with RoleCardGrid

### Phase 5: UI - Permission Editor
1. Create `PagePermissions.tsx` (tree with checkboxes)
2. Create `TablePermissions.tsx` (matrix layout)
3. Create `TagLabelPermissions.tsx`
4. Create `RoleDetailPanel.tsx` (combines all)

---

## Verification
1. Run `npx tsc --noEmit` after each phase
2. Create a test tenant and verify Super Admin role exists
3. Create a custom role and verify CRUD operations
4. Test page permissions (enable/disable views)
5. Test table permissions (show/hide columns)
6. Test data scope options:
   - "Self Only" - user sees only their own record
   - "Direct Reports" - user sees self + direct reports
   - "Department" - user sees all in same department
   - "All Company" - user sees everyone
7. Test advanced scope options (indirect reports, cross-department)
8. Verify Super Admin cannot be deleted or modified
9. Test cascade behavior between parent/child roles

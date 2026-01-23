# Directory CRUD Feature - Parallel Orchestration Plan

## Feature Request
> "Build a CRUD directory with table layout, import/export options, bulk upload that can find previous/duplicates, and a pending changes sidebar that shows all changes grouped per user - doesn't submit to backend until confirmed"

---

## Parallel Orchestration Breakdown

```
                              /orchestrate
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
    ┌────▼────┐              ┌─────▼─────┐            ┌──────▼──────┐
    │ TRACK 1 │              │  TRACK 2  │            │   TRACK 3   │
    │ Backend │              │  UI Core  │            │ Components  │
    │  Agent  │              │   Agent   │            │   Builder   │
    └────┬────┘              └─────┬─────┘            └──────┬──────┘
         │                         │                         │
    ┌────▼────┐              ┌─────▼─────┐            ┌──────▼──────┐
    │ - API   │              │ - Page    │            │ - DataTable │
    │ - CRUD  │              │ - Hooks   │            │ - ImportExp │
    │ - Bulk  │              │ - Sidebar │            │ - BulkModal │
    │ - Queue │              │ - State   │            │ - ChangeRow │
    └────┬────┘              └─────┬─────┘            └──────┬──────┘
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
                          ┌────────▼────────┐
                          │  MERGE & WIRE   │
                          │  (Integration)  │
                          └────────┬────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
    ┌────▼────┐              ┌─────▼─────┐            ┌──────▼──────┐
    │Validate │              │   Test    │            │    Docs     │
    └─────────┘              └───────────┘            └─────────────┘
```

---

## Phase 1: Parallel Development (Run Simultaneously)

### Track 1: Backend API (`/backend`)

**Agent Request:**
```yaml
AGENT_INVOCATION:
  agent: backend-api
  context: |
    Build directory management API for tenant schema:

    1. CRUD Endpoints:
       - GET /api/directory - List with pagination, search, filters
       - GET /api/directory/[id] - Single record
       - POST /api/directory - Create (add to pending queue)
       - PUT /api/directory/[id] - Update (add to pending queue)
       - DELETE /api/directory/[id] - Soft delete (add to pending queue)

    2. Bulk Operations:
       - POST /api/directory/bulk-upload - Accept CSV/Excel
       - POST /api/directory/bulk-validate - Check for duplicates
       - GET /api/directory/duplicates?hash=xxx - Find similar records

    3. Pending Changes Queue:
       - GET /api/directory/pending - List all pending changes
       - GET /api/directory/pending/by-user - Group by user
       - POST /api/directory/pending/confirm - Commit selected changes
       - DELETE /api/directory/pending/[id] - Discard change

    Schema considerations:
       - directory_pending table for queued changes
       - change_type: create | update | delete
       - changed_by: user_id
       - changed_at: timestamp
       - payload: JSON of the change
       - status: pending | confirmed | discarded
```

**Expected Output:**
- `src/app/api/directory/route.ts`
- `src/app/api/directory/[id]/route.ts`
- `src/app/api/directory/bulk-upload/route.ts`
- `src/app/api/directory/bulk-validate/route.ts`
- `src/app/api/directory/pending/route.ts`
- `src/app/api/directory/pending/confirm/route.ts`
- Prisma schema updates for pending changes

---

### Track 2: UI Core (`/ui`)

**Agent Request:**
```yaml
AGENT_INVOCATION:
  agent: ui-agent
  context: |
    Build directory management page with pending changes sidebar:

    Page Structure:
    src/app/(app)/directory/
    ├── page.tsx                    # Main layout with sidebar
    ├── page.module.sass
    ├── constants.ts                # Column configs, filter options
    ├── hooks/
    │   ├── useDirectory.ts         # Main data + CRUD operations
    │   ├── usePendingChanges.ts    # Pending queue state
    │   └── useBulkUpload.ts        # Upload handling
    └── components/
        ├── index.ts
        ├── DirectoryToolbar.tsx    # Search, filters, import/export buttons
        ├── PendingChangesSidebar.tsx # Right sidebar with grouped changes
        ├── PendingChangeGroup.tsx  # Collapsible group per user
        └── ConfirmChangesModal.tsx # Review before commit

    Key Features:
    1. Main area: DataTable with directory records
    2. Toolbar: Search, filters, Add, Import, Export buttons
    3. Right sidebar: Pending changes grouped by user
       - Collapsible sections per user
       - Each change shows: type (add/edit/delete), record name, timestamp
       - Checkbox to select/deselect
       - "Confirm Selected" and "Discard Selected" buttons
    4. All CRUD operations add to pending queue (local state first)
    5. Only confirmed changes hit the backend

    State Management (in hooks):
    - pendingChanges: Map<string, PendingChange[]> grouped by userId
    - localDirectory: directory data + pending changes merged
    - selectedChanges: Set<string> for bulk confirm/discard

    NOTE: Use stub API calls - backend is being built in parallel.
    Use these endpoint shapes:
    - GET /api/directory
    - POST /api/directory/pending/confirm
    - etc.
```

**Expected Output:**
- Page structure with hooks pattern
- Pending changes sidebar
- Local state management for optimistic updates
- Stub API integration

---

### Track 3: Shared Components (`/component`)

**Agent Request:**
```yaml
AGENT_INVOCATION:
  agent: ui-component-builder
  context: |
    Create these shared components for @/components:

    1. DataTable
       Location: src/components/DataTable/
       Props:
         - columns: ColumnDef[]
         - data: T[]
         - loading?: boolean
         - onRowClick?: (row: T) => void
         - selectable?: boolean
         - onSelectionChange?: (selected: T[]) => void
         - pagination?: { page, pageSize, total, onPageChange }
         - sorting?: { column, direction, onSort }
       Features:
         - Column sorting
         - Row selection with checkboxes
         - Loading skeleton
         - Empty state
         - Pagination controls

    2. ImportExport
       Location: src/components/ImportExport/
       Props:
         - onImport: (file: File) => Promise<void>
         - onExport: () => Promise<Blob>
         - importFormats?: string[] (default: ['csv', 'xlsx'])
         - exportFormats?: string[] (default: ['csv', 'xlsx'])
       Features:
         - Import button with file picker
         - Export dropdown with format selection
         - Loading states

    3. BulkUploadModal
       Location: src/components/BulkUploadModal/
       Props:
         - open: boolean
         - onClose: () => void
         - onUpload: (file: File) => Promise<BulkUploadResult>
         - onConfirm: (validRows: Row[]) => void
       Features:
         - Drag & drop zone
         - File preview
         - Validation results (valid/invalid/duplicate counts)
         - Duplicate review table
         - Select which to import

    4. ChangeIndicator
       Location: src/components/ChangeIndicator/
       Props:
         - type: 'create' | 'update' | 'delete'
         - size?: 'sm' | 'md'
       Features:
         - Visual badge showing change type
         - Green for create, yellow for update, red for delete
```

**Expected Output:**
- `src/components/DataTable/`
- `src/components/ImportExport/`
- `src/components/BulkUploadModal/`
- `src/components/ChangeIndicator/`
- Updated `src/components/index.ts` exports

---

## Phase 2: Integration (After Phase 1 Completes)

Once all three tracks complete, integrate:

```yaml
INTEGRATION_TASKS:
  - task: "Wire useDirectory hook to real API endpoints"
    agent: ui-agent
    files: ["src/app/(app)/directory/hooks/useDirectory.ts"]

  - task: "Import DataTable, ImportExport into directory page"
    agent: ui-agent
    files: ["src/app/(app)/directory/page.tsx"]

  - task: "Connect bulk upload modal to validation endpoint"
    agent: ui-agent
    files: ["src/app/(app)/directory/hooks/useBulkUpload.ts"]
```

---

## Phase 3: Quality (Run in Parallel)

### Validation (`/validate`)
```yaml
AGENT_INVOCATION:
  agent: ui-validation-agent
  context: "Validate directory feature uses correct components and patterns"
```

### Testing (`/test`)
```yaml
AGENT_INVOCATION:
  agent: testing-agent
  context: |
    Write tests for directory feature:
    - Component tests for DataTable, ImportExport, BulkUploadModal
    - Hook tests for useDirectory, usePendingChanges
    - E2E test for full CRUD flow with pending changes
```

### Documentation (`/docs`)
```yaml
AGENT_INVOCATION:
  agent: optivo-docs
  context: "Document directory feature with API specs and component usage"
```

---

## How to Execute This Plan

### Option 1: Single Orchestration Call
```
/orchestrate "Build directory CRUD with table, import/export, bulk upload with duplicate detection, and pending changes sidebar grouped by user"
```

The orchestrator will:
1. Create this plan
2. Launch Track 1, 2, 3 in parallel
3. Wait for all to complete
4. Run integration
5. Run validation, testing, docs in parallel
6. Output completion summary

### Option 2: Manual Parallel Invocation
Run these three commands simultaneously (in separate terminals or as parallel tool calls):

```bash
# Terminal 1
/backend "Implement directory API with CRUD, bulk upload, pending changes queue"

# Terminal 2
/ui "Build directory page with pending changes sidebar, local state management"

# Terminal 3
/component "Create DataTable, ImportExport, BulkUploadModal, ChangeIndicator"
```

Then run integration and quality checks.

---

## Expected Final Structure

```
src/
├── app/
│   ├── (app)/
│   │   └── directory/
│   │       ├── page.tsx
│   │       ├── page.module.sass
│   │       ├── constants.ts
│   │       ├── hooks/
│   │       │   ├── useDirectory.ts
│   │       │   ├── usePendingChanges.ts
│   │       │   └── useBulkUpload.ts
│   │       └── components/
│   │           ├── index.ts
│   │           ├── DirectoryToolbar.tsx
│   │           ├── PendingChangesSidebar.tsx
│   │           ├── PendingChangeGroup.tsx
│   │           └── ConfirmChangesModal.tsx
│   └── api/
│       └── directory/
│           ├── route.ts
│           ├── [id]/route.ts
│           ├── bulk-upload/route.ts
│           ├── bulk-validate/route.ts
│           └── pending/
│               ├── route.ts
│               └── confirm/route.ts
├── components/
│   ├── DataTable/
│   ├── ImportExport/
│   ├── BulkUploadModal/
│   ├── ChangeIndicator/
│   └── index.ts (updated)
└── e2e/
    └── directory.spec.ts
```

---

## Time Savings

| Approach | Estimated Work |
|----------|---------------|
| Sequential | ~45 min (1 agent at a time) |
| Parallel | ~20 min (3 agents simultaneously) |

Parallel execution cuts time by ~55% for complex features.

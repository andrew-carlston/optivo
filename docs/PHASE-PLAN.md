# Optivo — Phase Plan

## Build Order

Each module unlocks the next. No skipping.

### Phase 1: Core + Auth ✅
> Everything depends on this.

- Company creation + slug routing
- Neon Auth (Better Auth) — login, signup, Google SSO
- Session middleware — protect routes, resolve company → Neon branch
- User roles + access templates (ReBAC from day one)
- Super user / admin mode
- Theme + mode persistence per user

**Tables:** `core.companies`, `core.users`, `core.config`, `core.audit_log`, `core.notifications`

---

### Phase 2: HR + Org Structure
> Directory and attendance need this.

- Employees (the people record — separate from auth user)
- Departments, divisions, LOBs, positions
- Manager hierarchy (FK from day one)
- Org structure settings page
- Employee CRUD + bulk import

**Tables:** `hr.employees`, `hr.departments`, `hr.divisions`, `hr.lobs`, `hr.positions`

---

### Phase 3: Directory
> Realtime needs this for agent enrichment.

- Agent profiles (extends HR employee with contact center fields)
- Dynamic column management (system, template, custom columns)
- Column-level access via templates
- System connections (Five9 ID, AWS Connect ID, etc.)
- Inline editing, upload, export

**Tables:** `directory.agents`, `directory.columns`, `directory.column_access`, `directory.custom_fields`, `directory.system_connections`

---

### Phase 4: Realtime
> Attendance needs first-seen from this.

- Live agent state monitoring (Five9 WebSocket, AWS Kinesis)
- Queue metrics with hierarchical groups
- Status mappings + duration thresholds
- Worker: realtime consumer (TypeScript)
- Scope-filtered views
- Thread watchdog + stale cleanup

**Tables:** `realtime.agent_states`, `realtime.queue_metrics`, `realtime.queue_groups`, `realtime.queue_members`, `realtime.status_mappings`

---

### Phase 5: Schedule
> Attendance compares against this.

- Shift management (sync from external sources or manual)
- Schedule templates
- Three states: Working, Off, Not Scheduled
- All times UTC, display in agent timezone
- Calendar feed (.ics)
- Worker: schedule sync

**Tables:** `schedule.shifts`, `schedule.templates`, `schedule.calendar_tokens`

---

### Phase 6: Attendance
> Needs schedule + realtime + HR.

- Configurable point system (tiers, notified/unnotified, warnings, rolloff)
- Automated attendance checking (worker)
- First-seen permanent tracking
- Disputes with evidence upload
- Dashboard: charts, tables, warnings, export
- Settings UI for all rules

**Tables:** `attendance.config`, `attendance.log`, `attendance.points`, `attendance.point_history`, `attendance.first_seen`, `attendance.disputes`

---

### Phase 7: Analytics
> Needs data from everything above.

- Agent metrics (daily aggregates from realtime)
- Reports builder
- Saved filters per user
- Export (XLSX, PDF)
- Dashboard widgets

**Tables:** `analytics.agent_metrics`, `analytics.reports`, `analytics.saved_filters`

---

### Phase 8: Forecast
> Needs historical analytics data.

- Demand forecasting models
- Interval-level predictions
- Actual vs predicted tracking
- Scenario comparison (what-if)
- Worker: model runner

**Tables:** `forecast.models`, `forecast.predictions`, `forecast.actuals`, `forecast.scenarios`

---

### Phase 9: Staffing
> Needs forecast + HR.

- Headcount planning
- Skill group management
- Capacity modeling
- Hiring pipeline integration

**Tables:** `staffing.plans`, `staffing.headcount`, `staffing.skill_groups`, `staffing.capacity`

---

### Phase 10: Cost
> Needs staffing + HR.

- Budget planning
- Labor rate management
- Overtime rules
- Actual vs budget tracking
- Cost per contact modeling

**Tables:** `cost.budgets`, `cost.rates`, `cost.actuals`, `cost.labor_models`, `cost.overtime_rules`

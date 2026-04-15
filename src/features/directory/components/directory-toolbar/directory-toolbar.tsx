"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Settings, Upload, UserPlus, ChevronDown, ChevronUp, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Badge } from "@/components/ui/badge/badge";
import { Select, MultiSelect } from "@/components/ui/select/select";
import type { OrgOptions } from "@/features/directory/actions/employee-actions";
import type { StatusOptionRow, SavedViewRow } from "@/features/directory/actions/directory-actions";
import "./directory-toolbar.scss";

// ── Types ──

type DirectoryToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  departmentFilter: string[];
  onDepartmentFilterChange: (ids: string[]) => void;
  divisionFilter: string[];
  onDivisionFilterChange: (ids: string[]) => void;
  statusFilter: string[];
  onStatusFilterChange: (ids: string[]) => void;
  orgOptions: OrgOptions;
  statusOptions: StatusOptionRow[];
  savedViews: SavedViewRow[];
  activeViewId: string | null;
  onViewChange: (id: string | null) => void;
  onColumnPickerOpen: () => void;
  onImportOpen: () => void;
  onNewPerson: () => void;
  pendingCount: number;
  onReviewOpen: () => void;
};

// ── Debounce Hook ──

function useDebouncedCallback(fn: (value: string) => void, delay: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fn(value), delay);
    },
    [fn, delay],
  );
}

// ── Component ──

export function DirectoryToolbar({
  search,
  onSearchChange,
  departmentFilter,
  onDepartmentFilterChange,
  divisionFilter,
  onDivisionFilterChange,
  statusFilter,
  onStatusFilterChange,
  orgOptions,
  statusOptions,
  savedViews,
  activeViewId,
  onViewChange,
  onColumnPickerOpen,
  onImportOpen,
  onNewPerson,
  pendingCount,
  onReviewOpen,
}: DirectoryToolbarProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Sync external search prop
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const debouncedSearch = useDebouncedCallback(onSearchChange, 300);

  function handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setLocalSearch(value);
    debouncedSearch(value);
  }

  // Build filter options
  const departmentOptions = orgOptions.departments.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  const divisionOptions = orgOptions.divisions.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  const statusSelectOptions = statusOptions
    .filter((s) => s.active)
    .map((s) => ({
      value: s.value,
      label: s.label,
    }));

  // Build view options
  const viewOptions = [
    { value: "__default__", label: "Default View" },
    ...savedViews.map((v) => ({ value: v.id, label: v.name })),
  ];

  const activeFilterCount =
    departmentFilter.length + divisionFilter.length + statusFilter.length;

  return (
    <div className="dir-toolbar">
      {/* Top Row */}
      <div className="dir-toolbar__row">
        {/* Search */}
        <div className="dir-toolbar__search">
          <Input
            icon={<Search size={15} />}
            placeholder="Search people..."
            value={localSearch}
            onChange={handleSearchInput}
          />
        </div>

        {/* Filters toggle (mobile) */}
        <button
          type="button"
          className="dir-toolbar__filter-toggle"
          onClick={() => setFiltersOpen((prev) => !prev)}
        >
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="info" className="dir-toolbar__filter-count">
              {activeFilterCount}
            </Badge>
          )}
          {filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Desktop filters */}
        <div className="dir-toolbar__filters">
          <div className="dir-toolbar__filter">
            <MultiSelect
              options={departmentOptions}
              selected={departmentFilter}
              onChange={onDepartmentFilterChange}
              placeholder="Department"
              searchable={departmentOptions.length > 5}
            />
          </div>
          <div className="dir-toolbar__filter">
            <MultiSelect
              options={divisionOptions}
              selected={divisionFilter}
              onChange={onDivisionFilterChange}
              placeholder="Division"
              searchable={divisionOptions.length > 5}
            />
          </div>
          <div className="dir-toolbar__filter">
            <MultiSelect
              options={statusSelectOptions}
              selected={statusFilter}
              onChange={onStatusFilterChange}
              placeholder="Status"
              searchable={false}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="dir-toolbar__actions">
          {/* View switcher */}
          <div className="dir-toolbar__view">
            <Select
              options={viewOptions}
              value={activeViewId ?? "__default__"}
              onChange={(v) => onViewChange(v === "__default__" ? null : v)}
              placeholder="View"
            />
          </div>

          {/* Pending review */}
          {pendingCount > 0 && (
            <Button variant="outline" size="sm" onClick={onReviewOpen}>
              <ClipboardCheck size={14} />
              <span className="dir-toolbar__btn-label">Review</span>
              <Badge variant="warning" className="dir-toolbar__pending-badge">
                {pendingCount}
              </Badge>
            </Button>
          )}

          {/* Column picker */}
          <Button variant="ghost" size="icon" onClick={onColumnPickerOpen} title="Column settings">
            <Settings size={16} />
          </Button>

          {/* Import */}
          <Button variant="ghost" size="icon" onClick={onImportOpen} title="Import">
            <Upload size={16} />
          </Button>

          {/* New Person */}
          <Button variant="primary" size="sm" onClick={onNewPerson}>
            <UserPlus size={14} />
            <span className="dir-toolbar__btn-label">Add Person</span>
          </Button>
        </div>
      </div>

      {/* Mobile filters (collapsible) */}
      <div
        className={cn(
          "dir-toolbar__mobile-filters",
          filtersOpen && "dir-toolbar__mobile-filters--open",
        )}
      >
        <div className="dir-toolbar__mobile-filter">
          <label className="dir-toolbar__mobile-label">Department</label>
          <MultiSelect
            options={departmentOptions}
            selected={departmentFilter}
            onChange={onDepartmentFilterChange}
            placeholder="All Departments"
            searchable={departmentOptions.length > 5}
          />
        </div>
        <div className="dir-toolbar__mobile-filter">
          <label className="dir-toolbar__mobile-label">Division</label>
          <MultiSelect
            options={divisionOptions}
            selected={divisionFilter}
            onChange={onDivisionFilterChange}
            placeholder="All Divisions"
            searchable={divisionOptions.length > 5}
          />
        </div>
        <div className="dir-toolbar__mobile-filter">
          <label className="dir-toolbar__mobile-label">Status</label>
          <MultiSelect
            options={statusSelectOptions}
            selected={statusFilter}
            onChange={onStatusFilterChange}
            placeholder="All Statuses"
            searchable={false}
          />
        </div>
      </div>
    </div>
  );
}

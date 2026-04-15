"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { ArrowUp, ArrowDown, ArrowUpDown, Lock, Search, Filter } from "lucide-react";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/input/input";
import { Select } from "@/components/ui/select/select";
import { Badge } from "@/components/ui/badge/badge";
import { SkeletonTable } from "@/components/ui/skeleton/skeleton";
import type { EmployeeRow, OrgOptions } from "@/features/directory/actions/employee-actions";
import type { ColumnRow, StatusOptionRow } from "@/features/directory/actions/directory-actions";
import type { RowLock } from "@/features/directory/actions/lock-actions";
import "./directory-table.scss";

// ── Types ──

type DirectoryTableProps = {
  employees: EmployeeRow[];
  columns: ColumnRow[];
  orgOptions: OrgOptions;
  statusOptions: StatusOptionRow[];
  loading: boolean;
  locks: RowLock[];
  currentUserId: string;
  draftChanges: Map<string, Map<string, { oldValue: any; newValue: any }>>;
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (columnKey: string) => void;
  onCellEdit: (rowId: string, field: string, oldValue: any, newValue: any) => void;
  onRowClick: (rowId: string) => void;
  onLockClick: (rowId: string) => void;
};

// ── Helpers ──

/** Map a column key to the camelCase field on EmployeeRow for reading display values. */
const KEY_TO_FIELD: Record<string, keyof EmployeeRow> = {
  full_name: "fullName",
  first_name: "firstName",
  last_name: "lastName",
  email: "email",
  agent_id: "agentId",
  department_id: "departmentId",
  division_id: "divisionId",
  lob_id: "lobId",
  position_id: "positionId",
  manager_id: "managerId",
  employment_status: "employmentStatus",
  employment_type: "employmentType",
  start_date: "startDate",
  end_date: "endDate",
  timezone: "timezone",
  country: "country",
  state_province: "stateProvince",
  city: "city",
  active: "active",
};

/** Map select-type column keys to their name field on EmployeeRow. */
const KEY_TO_NAME: Record<string, keyof EmployeeRow> = {
  department_id: "departmentName",
  division_id: "divisionName",
  lob_id: "lobName",
  position_id: "positionName",
  manager_id: "managerName",
};

/** Build select options for org-type fields. */
function getOrgSelectOptions(
  columnKey: string,
  orgOptions: OrgOptions,
): { value: string; label: string }[] {
  switch (columnKey) {
    case "department_id":
      return orgOptions.departments.map((d) => ({ value: d.id, label: d.name }));
    case "division_id":
      return orgOptions.divisions.map((d) => ({ value: d.id, label: d.name }));
    case "lob_id":
      return orgOptions.lobs.map((d) => ({ value: d.id, label: d.name }));
    case "position_id":
      return orgOptions.positions.map((d) => ({ value: d.id, label: d.name }));
    case "manager_id":
      return orgOptions.managers.map((d) => ({ value: d.id, label: d.name }));
    default:
      return [];
  }
}

// ── Inline Edit Cell ──

function EditableCell({
  rowId,
  columnKey,
  columnType,
  value,
  displayValue,
  editable,
  selectOptions,
  isEdited,
  onEdit,
}: {
  rowId: string;
  columnKey: string;
  columnType: string;
  value: any;
  displayValue: string;
  editable: boolean;
  selectOptions: { value: string; label: string }[];
  isEdited: boolean;
  onEdit: (rowId: string, field: string, oldValue: any, newValue: any) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(String(value ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Reset local value when external value changes
  useEffect(() => {
    if (!editing) {
      setLocalValue(String(value ?? ""));
    }
  }, [value, editing]);

  function commitText() {
    setEditing(false);
    const trimmed = localValue.trim();
    const oldStr = String(value ?? "");
    if (trimmed !== oldStr) {
      onEdit(rowId, columnKey, value, trimmed || null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      commitText();
    } else if (e.key === "Escape") {
      setLocalValue(String(value ?? ""));
      setEditing(false);
    }
  }

  if (!editable) {
    return (
      <span className={cn("dir-table__cell-text", isEdited && "dir-table__cell-text--edited")}>
        {displayValue || "\u2014"}
      </span>
    );
  }

  // Select-type columns
  if (columnType === "select" && selectOptions.length > 0) {
    return (
      <div className={cn("dir-table__cell-select", isEdited && "dir-table__cell-select--edited")}>
        <Select
          options={[{ value: "__none__", label: "\u2014 None \u2014" }, ...selectOptions]}
          value={value ?? "__none__"}
          onChange={(v) => {
            const newVal = v === "__none__" ? null : v;
            if (newVal !== value) {
              onEdit(rowId, columnKey, value, newVal);
            }
          }}
          className="dir-table__inline-select"
        />
      </div>
    );
  }

  // Date-type columns
  if (columnType === "date") {
    return (
      <div className={cn("dir-table__cell-date", isEdited && "dir-table__cell-date--edited")}>
        <input
          type="date"
          className="dir-table__date-input"
          value={value ?? ""}
          onChange={(e) => {
            const newVal = e.target.value || null;
            if (newVal !== value) {
              onEdit(rowId, columnKey, value, newVal);
            }
          }}
        />
      </div>
    );
  }

  // Boolean columns
  if (columnType === "boolean") {
    return (
      <span className={cn("dir-table__cell-text", isEdited && "dir-table__cell-text--edited")}>
        {value ? "Yes" : "No"}
      </span>
    );
  }

  // Text / email / default — click to edit
  if (!editing) {
    return (
      <button
        type="button"
        className={cn("dir-table__cell-btn", isEdited && "dir-table__cell-btn--edited")}
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        title="Click to edit"
      >
        {displayValue || "\u2014"}
      </button>
    );
  }

  return (
    <Input
      ref={inputRef}
      type={columnType === "email" ? "email" : "text"}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={commitText}
      onKeyDown={handleKeyDown}
      className="dir-table__inline-input"
    />
  );
}

// ── Main Component ──

export function DirectoryTable({
  employees,
  columns,
  orgOptions,
  statusOptions,
  loading,
  locks,
  currentUserId,
  draftChanges,
  sortBy,
  sortDir,
  onSort,
  onCellEdit,
  onRowClick,
  onLockClick,
}: DirectoryTableProps) {
  const [columnSearch, setColumnSearch] = useState<Record<string, boolean>>({});
  const [columnFilter, setColumnFilter] = useState<Record<string, boolean>>({});

  // Build lock lookup
  const lockMap = useMemo(() => {
    const map = new Map<string, RowLock>();
    for (const lock of locks) {
      map.set(lock.rowId, lock);
    }
    return map;
  }, [locks]);

  // Build visible columns (only active + visible)
  const visibleColumns = useMemo(
    () =>
      columns
        .filter((c) => c.active && c.visibleByDefault)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [columns],
  );

  // Toggle column search / filter
  const toggleColumnSearch = useCallback((key: string) => {
    setColumnSearch((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleColumnFilter = useCallback((key: string) => {
    setColumnFilter((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Build TanStack column defs
  const columnDefs = useMemo<ColumnDef<EmployeeRow>[]>(() => {
    return visibleColumns.map((col) => {
      const field = KEY_TO_FIELD[col.columnKey] ?? col.columnKey;
      const nameField = KEY_TO_NAME[col.columnKey];
      const isOrgField = !!nameField;
      const isStatus = col.columnKey === "employment_status";
      const isEmploymentType = col.columnKey === "employment_type";

      // Determine select options
      let selectOptions: { value: string; label: string }[] = [];
      if (isOrgField) {
        selectOptions = getOrgSelectOptions(col.columnKey, orgOptions);
      } else if (isStatus) {
        selectOptions = statusOptions
          .filter((s) => s.active)
          .map((s) => ({ value: s.value, label: s.label }));
      } else if (isEmploymentType) {
        selectOptions = col.options;
      } else if (col.type === "select" && col.options.length > 0) {
        selectOptions = col.options;
      }

      return {
        id: col.columnKey,
        accessorFn: (row: EmployeeRow) => {
          // For org fields, return the ID as value
          if (isOrgField) return row[field as keyof EmployeeRow];
          return row[field as keyof EmployeeRow];
        },
        header: () => col.label,
        cell: ({ row: tableRow }) => {
          const employee = tableRow.original;
          const rawValue = employee[field as keyof EmployeeRow];

          // Display value: use name for org fields, label for status
          let displayValue = String(rawValue ?? "");
          if (isOrgField && nameField) {
            displayValue = String(employee[nameField] ?? "");
          } else if (isStatus) {
            const opt = statusOptions.find((s) => s.value === rawValue);
            displayValue = opt?.label ?? String(rawValue ?? "");
          } else if (isEmploymentType) {
            const opt = col.options.find((o) => o.value === rawValue);
            displayValue = opt?.label ?? String(rawValue ?? "");
          }

          // Check for draft changes
          const rowDrafts = draftChanges.get(employee.id);
          const fieldDraft = rowDrafts?.get(col.columnKey);
          const isEdited = !!fieldDraft;
          const effectiveValue = isEdited ? fieldDraft.newValue : rawValue;

          if (isEdited && isOrgField) {
            const opt = selectOptions.find((o) => o.value === fieldDraft.newValue);
            displayValue = opt?.label ?? displayValue;
          } else if (isEdited && isStatus) {
            const opt = statusOptions.find((s) => s.value === fieldDraft.newValue);
            displayValue = opt?.label ?? displayValue;
          } else if (isEdited && isEmploymentType) {
            const opt = col.options.find((o) => o.value === fieldDraft.newValue);
            displayValue = opt?.label ?? displayValue;
          }

          // Check if row is locked by someone else
          const lock = lockMap.get(employee.id);
          const lockedByOther = lock && lock.userId !== currentUserId;
          const editable = col.editable && !lockedByOther;

          return (
            <EditableCell
              rowId={employee.id}
              columnKey={col.columnKey}
              columnType={col.type}
              value={effectiveValue}
              displayValue={isEdited ? displayValue : displayValue}
              editable={editable}
              selectOptions={selectOptions}
              isEdited={isEdited}
              onEdit={onCellEdit}
            />
          );
        },
        meta: { col },
      } satisfies ColumnDef<EmployeeRow>;
    });
  }, [visibleColumns, orgOptions, statusOptions, draftChanges, lockMap, currentUserId, onCellEdit]);

  // TanStack Table instance
  const table = useReactTable({
    data: employees,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  // ── Render ──

  if (loading) {
    return (
      <div className="dir-table dir-table--loading">
        <SkeletonTable rows={8} cols={visibleColumns.length || 5} />
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="dir-table dir-table--empty">
        <p className="dir-table__empty-msg">
          No employees found. Add people to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="dir-table">
      <div className="dir-table__scroll">
        <table className="dir-table__table">
          <thead className="dir-table__thead">
            <tr>
              {/* Lock indicator column */}
              <th className="dir-table__th dir-table__th--lock" aria-label="Lock status">
                <Lock size={12} />
              </th>
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => {
                  const col = (header.column.columnDef.meta as any)?.col as ColumnRow | undefined;
                  const isSorted = sortBy === header.id;
                  return (
                    <th key={header.id} className="dir-table__th">
                      <div className="dir-table__th-content">
                        <button
                          type="button"
                          className="dir-table__th-sort"
                          onClick={() => onSort(header.id)}
                        >
                          <span className="dir-table__th-label">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          <span className="dir-table__th-arrow">
                            {isSorted && sortDir === "asc" && <ArrowUp size={12} />}
                            {isSorted && sortDir === "desc" && <ArrowDown size={12} />}
                            {!isSorted && <ArrowUpDown size={12} />}
                          </span>
                        </button>
                        <div className="dir-table__th-actions">
                          {col?.searchable && (
                            <button
                              type="button"
                              className={cn(
                                "dir-table__th-icon",
                                columnSearch[header.id] && "dir-table__th-icon--active",
                              )}
                              onClick={() => toggleColumnSearch(header.id)}
                              title="Toggle column search"
                            >
                              <Search size={11} />
                            </button>
                          )}
                          {col?.filterable && (
                            <button
                              type="button"
                              className={cn(
                                "dir-table__th-icon",
                                columnFilter[header.id] && "dir-table__th-icon--active",
                              )}
                              onClick={() => toggleColumnFilter(header.id)}
                              title="Toggle column filter"
                            >
                              <Filter size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                }),
              )}
            </tr>
          </thead>
          <tbody className="dir-table__tbody">
            {table.getRowModel().rows.map((row) => {
              const lock = lockMap.get(row.id);
              const lockedByOther = lock && lock.userId !== currentUserId;
              const lockedBySelf = lock && lock.userId === currentUserId;
              const rowHasEdits = draftChanges.has(row.id);

              return (
                <tr
                  key={row.id}
                  className={cn(
                    "dir-table__tr",
                    lockedByOther && "dir-table__tr--locked",
                    lockedBySelf && "dir-table__tr--self-locked",
                    rowHasEdits && "dir-table__tr--edited",
                  )}
                  onClick={() => onRowClick(row.id)}
                >
                  {/* Lock cell */}
                  <td className="dir-table__td dir-table__td--lock">
                    {lock && (
                      <button
                        type="button"
                        className={cn(
                          "dir-table__lock-btn",
                          lockedByOther && "dir-table__lock-btn--other",
                          lockedBySelf && "dir-table__lock-btn--self",
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (lockedByOther) onLockClick(row.id);
                        }}
                        title={
                          lockedByOther
                            ? `Locked by ${lock.userName} \u2014 click to request override`
                            : `Locked by you`
                        }
                      >
                        <Lock size={13} />
                      </button>
                    )}
                  </td>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="dir-table__td">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="dir-table__footer">
        <span className="dir-table__count">
          {employees.length} {employees.length === 1 ? "person" : "people"}
        </span>
      </div>
    </div>
  );
}

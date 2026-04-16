"use client";

import { useState, useCallback } from "react";
import { useCurrentCompany, useCurrentUser } from "@/features/core/providers/company-provider";
import { useDirectory } from "@/features/directory/hooks/use-directory";
import { useDraftChanges } from "@/features/directory/hooks/use-draft-changes";
import { DirectoryTable } from "@/features/directory/components/directory-table/directory-table";
import { DirectoryToolbar } from "@/features/directory/components/directory-toolbar/directory-toolbar";
import { ReviewSidebar } from "@/features/directory/components/review-sidebar/review-sidebar";
import { PendingToast } from "@/features/directory/components/pending-toast/pending-toast";
import { EmployeeForm } from "@/features/directory/components/employee-form/employee-form";
import { createEmployee, applyChanges } from "@/features/directory/actions/employee-actions";
import { acquireRowLock, releaseRowLock, savePendingChange, clearPendingChanges } from "@/features/directory/actions/lock-actions";

export default function DirectoryPage() {
  const company = useCurrentCompany();
  const user = useCurrentUser();

  const {
    employees, columns, orgOptions, statusOptions, savedViews, locks,
    loading, filters, setFilters, refresh, refreshEmployees, refreshLocks,
  } = useDirectory(company.slug);

  const {
    drafts, addChange, removeChange, removeRow, clearAll, totalCount,
  } = useDraftChanges(company.id, user.id);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  // ── Sort state ──
  const [sortBy, setSortBy] = useState("full_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // ── Filter state ──
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [divisionFilter, setDivisionFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // ── Handlers ──

  function handleSort(columnKey: string) {
    if (sortBy === columnKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(columnKey);
      setSortDir("asc");
    }
    setFilters((prev) => ({ ...prev, sortBy: columnKey, sortDir: sortBy === columnKey && sortDir === "asc" ? "desc" : "asc" }));
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setFilters((prev) => ({ ...prev, search: value }));
  }

  function handleDepartmentFilter(ids: string[]) {
    setDepartmentFilter(ids);
    setFilters((prev) => ({ ...prev, departmentIds: ids.length ? ids : undefined }));
  }

  function handleDivisionFilter(ids: string[]) {
    setDivisionFilter(ids);
    setFilters((prev) => ({ ...prev, divisionIds: ids.length ? ids : undefined }));
  }

  function handleStatusFilter(ids: string[]) {
    setStatusFilter(ids);
    setFilters((prev) => ({ ...prev, statuses: ids.length ? ids : undefined }));
  }

  async function handleCellEdit(rowId: string, field: string, oldValue: any, newValue: any) {
    // Acquire lock if not already locked by this user
    const existingLock = locks.find((l) => l.rowId === rowId && l.userId === user.id);
    if (!existingLock) {
      try {
        await acquireRowLock(company.slug, rowId);
        refreshLocks();
      } catch (err: any) {
        // Row locked by someone else
        return;
      }
    }

    // Save draft
    addChange(rowId, field, oldValue, newValue);

    // Backup to server
    await savePendingChange(company.slug, {
      rowId,
      field,
      oldValue: oldValue != null ? String(oldValue) : null,
      newValue: newValue != null ? String(newValue) : null,
    });
  }

  async function handleApprove(rowId: string, field: string) {
    const change = drafts.get(rowId)?.get(field);
    if (!change) return;

    await applyChanges(company.slug, [{ rowId, field, value: change.newValue }]);
    removeChange(rowId, field);

    // Release lock if no more changes for this row
    const rowChanges = drafts.get(rowId);
    if (!rowChanges || rowChanges.size <= 1) {
      await releaseRowLock(company.slug, rowId);
    }

    refreshEmployees();
    refreshLocks();
  }

  async function handleReject(rowId: string, field: string) {
    removeChange(rowId, field);

    // Release lock if no more changes for this row
    const rowChanges = drafts.get(rowId);
    if (!rowChanges || rowChanges.size <= 1) {
      await releaseRowLock(company.slug, rowId);
      refreshLocks();
    }
  }

  async function handleApproveAll() {
    const changes: { rowId: string; field: string; value: any }[] = [];
    for (const [rowId, fields] of drafts) {
      for (const [field, change] of fields) {
        changes.push({ rowId, field, value: change.newValue });
      }
    }

    if (changes.length > 0) {
      await applyChanges(company.slug, changes);
    }

    // Release all locks
    for (const rowId of drafts.keys()) {
      await releaseRowLock(company.slug, rowId);
    }

    clearAll();
    setReviewOpen(false);
    refreshEmployees();
    refreshLocks();
  }

  function handleRejectAll() {
    // Release all locks
    for (const rowId of drafts.keys()) {
      releaseRowLock(company.slug, rowId);
    }
    clearAll();
    setReviewOpen(false);
    refreshLocks();
  }

  async function handleCreateEmployee(data: any) {
    await createEmployee(company.slug, data);
    setFormOpen(false);
    refreshEmployees();
  }

  // ── Visible columns (filter by active + user visibility) ──
  const visibleColumns = columns.filter((c) => c.active && c.visibleByDefault);

  return (
    <>
      <DirectoryToolbar
        search={search}
        onSearchChange={handleSearchChange}
        departmentFilter={departmentFilter}
        onDepartmentFilterChange={handleDepartmentFilter}
        divisionFilter={divisionFilter}
        onDivisionFilterChange={handleDivisionFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilter}
        orgOptions={orgOptions}
        statusOptions={statusOptions}
        savedViews={savedViews}
        activeViewId={activeViewId}
        onViewChange={setActiveViewId}
        onColumnPickerOpen={() => {}}
        onImportOpen={() => {}}
        onNewPerson={() => setFormOpen(true)}
        pendingCount={totalCount}
        onReviewOpen={() => setReviewOpen(true)}
      />

      <DirectoryTable
        employees={employees}
        columns={visibleColumns}
        orgOptions={orgOptions}
        statusOptions={statusOptions}
        loading={loading}
        locks={locks}
        currentUserId={user.id}
        draftChanges={drafts}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        onCellEdit={handleCellEdit}
        onRowClick={() => {}}
        onLockClick={() => {}}
      />

      <ReviewSidebar
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        changes={drafts}
        employees={employees.map((e) => ({ id: e.id, fullName: e.fullName }))}
        columns={columns.map((c) => ({ columnKey: c.columnKey, label: c.label }))}
        onApprove={handleApprove}
        onReject={handleReject}
        onApproveAll={handleApproveAll}
        onRejectAll={handleRejectAll}
      />

      <PendingToast
        count={totalCount}
        onReviewClick={() => setReviewOpen(true)}
      />

      <EmployeeForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        orgOptions={orgOptions}
        statusOptions={statusOptions}
        onSave={handleCreateEmployee}
      />
    </>
  );
}

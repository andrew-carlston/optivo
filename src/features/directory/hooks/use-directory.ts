"use client";

import { useState, useEffect, useCallback } from "react";
import { getDirectoryPageData } from "@/features/directory/actions/directory-actions";
import { getActiveLocks } from "@/features/directory/actions/lock-actions";
import { getEmployees } from "@/features/directory/actions/employee-actions";
import type { EmployeeRow, EmployeeFilters, OrgOptions } from "@/features/directory/actions/employee-actions";
import type { ColumnRow, StatusOptionRow, SavedViewRow } from "@/features/directory/actions/directory-actions";
import type { RowLock } from "@/features/directory/actions/lock-actions";

export function useDirectory(companySlug: string) {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [columns, setColumns] = useState<ColumnRow[]>([]);
  const [orgOptions, setOrgOptions] = useState<OrgOptions>({ departments: [], divisions: [], lobs: [], positions: [], managers: [] });
  const [statusOptions, setStatusOptions] = useState<StatusOptionRow[]>([]);
  const [savedViews, setSavedViews] = useState<SavedViewRow[]>([]);
  const [locks, setLocks] = useState<RowLock[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EmployeeFilters>({});

  // Initial load: single batched action (1 auth round-trip, all data in parallel on one connection)
  const load = useCallback(async () => {
    const data = await getDirectoryPageData(companySlug);
    setColumns(data.columns);
    setOrgOptions(data.orgOptions);
    setStatusOptions(data.statusOptions);
    setSavedViews(data.savedViews);
    setEmployees(data.employees);
    setLocks(data.locks);
    setLoading(false);
  }, [companySlug]);

  useEffect(() => { load(); }, [load]);

  // Filtered refresh — only re-fetch employees when filters change
  const refreshEmployees = useCallback(async () => {
    const [emps, activeLocks] = await Promise.all([
      getEmployees(companySlug, filters),
      getActiveLocks(companySlug),
    ]);
    setEmployees(emps);
    setLocks(activeLocks);
  }, [companySlug, filters]);

  const refreshLocks = useCallback(async () => {
    const activeLocks = await getActiveLocks(companySlug);
    setLocks(activeLocks);
  }, [companySlug]);

  return {
    employees,
    columns,
    orgOptions,
    statusOptions,
    savedViews,
    locks,
    loading,
    filters,
    setFilters,
    refresh: load,
    refreshEmployees,
    refreshLocks,
  };
}

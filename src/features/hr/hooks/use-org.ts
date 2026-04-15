"use client";

import { useState, useEffect, useCallback } from "react";
import { getDepartments, getDivisions, getLobs, getPositions } from "@/features/hr/actions/org-actions";
import type { DepartmentRow, DivisionRow, LobRow, PositionRow } from "@/features/hr/actions/org-actions";

export function useOrgStructure(companySlug: string) {
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [divisions, setDivisions] = useState<DivisionRow[]>([]);
  const [lobs, setLobs] = useState<LobRow[]>([]);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [d, v, l, p] = await Promise.all([
      getDepartments(companySlug),
      getDivisions(companySlug),
      getLobs(companySlug),
      getPositions(companySlug),
    ]);
    setDepartments(d);
    setDivisions(v);
    setLobs(l);
    setPositions(p);
    setLoading(false);
  }, [companySlug]);

  useEffect(() => { load(); }, [load]);

  return {
    departments,
    divisions,
    lobs,
    positions,
    loading,
    refresh: load,
  };
}

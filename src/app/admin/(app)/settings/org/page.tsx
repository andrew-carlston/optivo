"use client";

import { useState, useEffect } from "react";
import { useCurrentCompany } from "@/features/core/providers/company-provider";
import { OrgSettings } from "@/features/hr/components/org-settings/org-settings";
import {
  getOrgStructureAll,
  createDepartment, updateDepartment, archiveDepartment,
  createDivision, updateDivision, archiveDivision,
  createLob, updateLob, archiveLob,
  createPosition, updatePosition, archivePosition,
  createLocation, updateLocation, archiveLocation,
} from "@/features/hr/actions/org-actions";
import type { DepartmentRow, DivisionRow, LobRow, PositionRow, LocationRow } from "@/features/hr/actions/org-actions";

export default function OrgSettingsPage() {
  const company = useCurrentCompany();
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [divisions, setDivisions] = useState<DivisionRow[]>([]);
  const [lobs, setLobs] = useState<LobRow[]>([]);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await getOrgStructureAll(company.slug);
    setDepartments(data.departments);
    setDivisions(data.divisions);
    setLobs(data.lobs);
    setPositions(data.positions);
    setLocations(data.locations);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <OrgSettings
      departments={departments}
      divisions={divisions}
      lobs={lobs}
      positions={positions}
      locations={locations}
      loading={loading}
      onCreateDepartment={async (data) => { await createDepartment(company.slug, data); load(); }}
      onUpdateDepartment={async (id, data) => { await updateDepartment(company.slug, id, data); load(); }}
      onArchiveDepartment={async (id) => { await archiveDepartment(company.slug, id); load(); }}
      onCreateDivision={async (data) => { await createDivision(company.slug, data); load(); }}
      onUpdateDivision={async (id, data) => { await updateDivision(company.slug, id, data); load(); }}
      onArchiveDivision={async (id) => { await archiveDivision(company.slug, id); load(); }}
      onCreateLob={async (data) => { await createLob(company.slug, data); load(); }}
      onUpdateLob={async (id, data) => { await updateLob(company.slug, id, data); load(); }}
      onArchiveLob={async (id) => { await archiveLob(company.slug, id); load(); }}
      onCreatePosition={async (data) => { await createPosition(company.slug, data); load(); }}
      onUpdatePosition={async (id, data) => { await updatePosition(company.slug, id, data); load(); }}
      onArchivePosition={async (id) => { await archivePosition(company.slug, id); load(); }}
      onCreateLocation={async (data) => { await createLocation(company.slug, data); load(); }}
      onUpdateLocation={async (id, data) => { await updateLocation(company.slug, id, data); load(); }}
      onArchiveLocation={async (id) => { await archiveLocation(company.slug, id); load(); }}
    />
  );
}

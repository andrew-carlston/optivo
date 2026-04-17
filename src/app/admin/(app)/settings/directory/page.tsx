import { getColumns, getStatusOptions } from "@/features/directory/actions/directory-actions";
import { getOrgStructureAll } from "@/features/hr/actions/org-actions";
import { DirectorySettings } from "@/features/directory/components/directory-settings/directory-settings";

export default async function DirectorySettingsPage() {
  const [columns, statusOptions, orgData] = await Promise.all([
    getColumns("admin"),
    getStatusOptions("admin"),
    getOrgStructureAll("admin"),
  ]);

  return (
    <DirectorySettings
      companySlug="admin"
      initialColumns={columns}
      initialStatusOptions={statusOptions}
      initialEmploymentTypes={orgData.employmentTypes}
      initialWorkingStatuses={orgData.workingStatuses}
    />
  );
}

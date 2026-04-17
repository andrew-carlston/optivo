import { getColumns } from "@/features/directory/actions/directory-actions";
import { getOrgStructureAll } from "@/features/hr/actions/org-actions";
import { DirectorySettings } from "@/features/directory/components/directory-settings/directory-settings";

export default async function DirectorySettingsPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const [columns, orgData] = await Promise.all([
    getColumns(company),
    getOrgStructureAll(company),
  ]);

  return (
    <DirectorySettings
      companySlug={company}
      initialColumns={columns}
      initialEmploymentTypes={orgData.employmentTypes}
      initialWorkingStatuses={orgData.workingStatuses}
    />
  );
}

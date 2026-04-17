import { getOrgStructureAll } from "@/features/hr/actions/org-actions";
import { OrgSettings } from "@/features/hr/components/org-settings/org-settings";

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const data = await getOrgStructureAll(company);

  return <OrgSettings companySlug={company} initialData={data} />;
}

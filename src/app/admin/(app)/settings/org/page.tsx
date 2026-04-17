import { getOrgStructureAll } from "@/features/hr/actions/org-actions";
import { OrgSettings } from "@/features/hr/components/org-settings/org-settings";

export default async function OrgSettingsPage() {
  const data = await getOrgStructureAll("admin");

  return <OrgSettings companySlug="admin" initialData={data} />;
}

import { redirect } from "next/navigation";
import {
  getServerSession,
  getCompanyBySlug,
  resolveCompanyAccess,
} from "@/features/core/lib/session";
import { serializePermissions } from "@/features/core/lib/access/load-permissions";
import { CompanyProvider } from "@/features/core/providers/company-provider";
import { CompanyShell } from "@/features/core/components/company-shell";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ company: string }>;
}) {
  const { company: slug } = await params;

  let session;
  try {
    session = await getServerSession();
  } catch {
    return <>{children}</>;
  }
  if (!session) {
    return <>{children}</>;
  }

  let company;
  try {
    company = await getCompanyBySlug(slug);
  } catch {
    redirect("/");
  }
  if (!company) {
    redirect("/");
  }

  const access = await resolveCompanyAccess(session, company);
  if (!access) {
    // Authenticated but no access — send to admin, not login (avoids redirect loop)
    redirect("/admin");
  }

  return (
    <CompanyProvider
      company={company}
      user={access.user}
      isSuper={access.isSuper}
      isPlatformUser={access.isPlatformUser}
      permissions={serializePermissions(access.permissions)}
    >
      <CompanyShell>{children}</CompanyShell>
    </CompanyProvider>
  );
}

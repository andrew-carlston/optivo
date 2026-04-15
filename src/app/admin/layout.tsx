import { redirect } from "next/navigation";
import {
  getServerSession,
  getCompanyBySlug,
  resolveCompanyAccess,
} from "@/features/core/lib/session";
import { serializePermissions } from "@/features/core/lib/access/load-permissions";
import { CompanyProvider } from "@/features/core/providers/company-provider";
import { CompanyShell } from "@/features/core/components/company-shell";

/**
 * The admin panel is just the "admin" company — the platform owner's own
 * internal company. It gets the full CompanyShell (Dashboard, Directory, Org
 * Settings, etc.) plus a super-only "Platform" nav group with client
 * management, platform users, billing, etc.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    company = await getCompanyBySlug("admin");
  } catch {
    redirect("/");
  }
  if (!company) {
    redirect("/");
  }

  const access = await resolveCompanyAccess(session, company);
  if (!access) {
    redirect("/admin/login");
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

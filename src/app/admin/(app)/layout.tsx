import { redirect } from "next/navigation";
import {
  getServerSession,
  getCompanyBySlug,
  resolveCompanyAccess,
} from "@/features/core/lib/session";
import { serializePermissions } from "@/features/core/lib/access/load-permissions";
import { CompanyProvider } from "@/features/core/providers/company-provider";
import { CompanyShell } from "@/features/core/components/company-shell";

// Session-gated — must resolve on every request.
export const dynamic = "force-dynamic";

/**
 * Authenticated admin-app layout.
 *
 * The admin panel IS the "admin" company — same CompanyShell used for every
 * client company, plus a super-only "Platform" nav group in the Settings
 * sidebar for client management, platform users, billing, etc.
 *
 * This layout applies to everything under src/app/admin/(app)/*. The
 * /admin/login route lives outside the route group so it renders without
 * the shell (no redirect loop).
 */
export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) redirect("/admin/login");

  const company = await getCompanyBySlug("admin");
  if (!company) redirect("/");

  const access = await resolveCompanyAccess(session, company);
  if (!access) redirect("/");

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

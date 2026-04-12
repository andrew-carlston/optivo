import { redirect } from "next/navigation";
import { db, createBranchDb } from "@/db/client";
import {
  getServerSession,
  getCompanyBySlug,
  getOrCreateBranchUser,
  getSuperUser,
  getSuperUserCompanyAccess,
} from "@/features/core/lib/session";
import { loadPermissions, serializePermissions } from "@/features/core/lib/access/load-permissions";
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
    // Session check failed (expired, DB error, etc.)
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

  let user;
  let isSuper = false;

  try {
    if (company.branchHost) {
      user = await getOrCreateBranchUser(company.branchHost, session, company.id);
    }

    if (!user) {
      const superUser = await getSuperUser(session.user.id);
      if (superUser) {
        user = superUser;
        isSuper = true;
      }
    }
  } catch {
    // User resolution failed
  }

  if (!user) {
    redirect(`/${slug}/login`);
  }

  // Load permissions
  let permissions: import("@/features/core/lib/access/types").PermissionMap = new Map();

  try {
    if (isSuper) {
      const access = await getSuperUserCompanyAccess(user.id, company.id);
      if (!access.hasAccess) {
        redirect("/admin");
      }
      if (access.templateId) {
        permissions = await loadPermissions(db, access.templateId);
        isSuper = false;
      }
    } else if (user.accessTemplateId) {
      const branchDb = company.branchHost ? createBranchDb(company.branchHost) : null;
      if (branchDb) {
        permissions = await loadPermissions(branchDb, user.accessTemplateId);
      }
    }
  } catch {
    // Permission loading failed — proceed with empty permissions
  }

  return (
    <CompanyProvider company={company} user={user} isSuper={isSuper} permissions={serializePermissions(permissions)}>
      <CompanyShell>{children}</CompanyShell>
    </CompanyProvider>
  );
}

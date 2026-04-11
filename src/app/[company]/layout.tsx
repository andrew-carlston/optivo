import { redirect } from "next/navigation";
import {
  getServerSession,
  getCompanyBySlug,
  getOrCreateBranchUser,
  getSuperUser,
} from "@/features/core/lib/session";
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

  // No session → render children directly (login page, etc.)
  // Middleware gates all non-login routes, so this only applies to /login
  const session = await getServerSession();
  if (!session) {
    return <>{children}</>;
  }

  // Look up company on main branch
  const company = await getCompanyBySlug(slug);
  if (!company) {
    redirect("/");
  }

  // Resolve user: check company branch first, then super user on main
  let user;
  let isSuper = false;

  if (company.branchHost) {
    user = await getOrCreateBranchUser(company.branchHost, session, company.id);
  }

  // If no branch user (or no branch host yet), check if super user
  if (!user) {
    const superUser = await getSuperUser(session.user.id);
    if (superUser) {
      user = superUser;
      isSuper = true;
    }
  }

  // No user found anywhere — not authorized for this company
  if (!user) {
    redirect(`/${slug}/login`);
  }

  return (
    <CompanyProvider company={company} user={user} isSuper={isSuper}>
      <CompanyShell>{children}</CompanyShell>
    </CompanyProvider>
  );
}

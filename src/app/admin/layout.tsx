import { redirect } from "next/navigation";
import { getServerSession, getPlatformUser } from "@/features/core/lib/session";
import { AdminShell } from "@/features/core/components/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // No session → render children (login page).
  // Middleware gates non-login admin routes.
  if (!session) {
    return <>{children}</>;
  }

  // Authenticated — verify platform user (any user in core.users on main)
  const platformUser = await getPlatformUser(session.user.id);
  if (!platformUser) {
    redirect("/");
  }

  return (
    <AdminShell user={{ fullName: platformUser.fullName, email: platformUser.email, avatarUrl: platformUser.avatarUrl }} isSuper={platformUser.isSuper}>
      {children}
    </AdminShell>
  );
}

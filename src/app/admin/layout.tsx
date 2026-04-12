import { redirect } from "next/navigation";
import { getServerSession, getSuperUser } from "@/features/core/lib/session";
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

  // Authenticated — verify super user access
  const superUser = await getSuperUser(session.user.id);
  if (!superUser) {
    redirect("/");
  }

  return (
    <AdminShell user={{ fullName: superUser.fullName, email: superUser.email, avatarUrl: superUser.avatarUrl }}>
      {children}
    </AdminShell>
  );
}

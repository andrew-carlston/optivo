import Link from "next/link";
import { requireSession, getSuperUser, getAllCompanies } from "@/features/core/lib/session";
import { redirect } from "next/navigation";
import "./admin.scss";

export default async function AdminPage() {
  const session = await requireSession();
  const superUser = await getSuperUser(session.user.id);
  if (!superUser) redirect("/");

  const companies = await getAllCompanies();

  return (
    <div className="admin">
      <h2 className="admin__section-title">Companies</h2>

      <div className="admin__grid">¡¡
        {companies.map((company) => (
          <Link
            key={company.id}
            href={`/${company.slug}/dashboard`}
            className="admin__company-card"
          >
            <div className="admin__company-logo">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} />
              ) : (
                <span>{company.name.charAt(0)}</span>
              )}
            </div>
            <div className="admin__company-info">
              <span className="admin__company-name">{company.name}</span>
              <span className="admin__company-slug">/{company.slug}</span>
            </div>
            <span className="admin__company-tz">{company.timezone}</span>
          </Link>
        ))}
      </div>

      {companies.length === 0 && (
        <p className="admin__empty">No companies yet.</p>
      )}
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton/skeleton";
import "./org-settings.scss";

export function OrgSettingsSkeleton() {
  return (
    <div className="org-settings">
      <div className="org-settings__header">
        <h2>Organization</h2>
      </div>

      {/* Tab bar skeleton */}
      <div className="org-settings__tabs">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ padding: "8px 12px" }}>
            <Skeleton width={i % 2 === 0 ? 100 : 80} height={16} />
          </div>
        ))}
      </div>

      {/* Toolbar skeleton */}
      <div className="org-settings__toolbar">
        <div className="org-settings__toolbar-search">
          <Skeleton width="100%" height={40} radius="lg" />
        </div>
        <Skeleton width={100} height={24} />
        <Skeleton width={80} height={36} radius="lg" />
      </div>

      {/* Table skeleton */}
      <div className="org-table__wrap">
        <table className="org-table">
          <thead>
            <tr>
              <th><Skeleton width={60} height={12} /></th>
              <th><Skeleton width={80} height={12} /></th>
              <th><Skeleton width={70} height={12} /></th>
              <th><Skeleton width={50} height={12} /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td><Skeleton width="60%" height={20} /></td>
                <td><Skeleton width={80} height={20} /></td>
                <td><Skeleton width={40} height={20} /></td>
                <td><Skeleton width={40} height={20} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

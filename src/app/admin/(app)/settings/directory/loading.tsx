import { Skeleton } from "@/components/ui/skeleton/skeleton";
import "@/features/directory/components/directory-settings/directory-settings.scss";

export default function Loading() {
  return (
    <div className="dir-settings">
      <div className="dir-settings__header"><h2>Directory Settings</h2></div>
      <div className="dir-settings__tabs">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ padding: "8px 12px" }}>
            <Skeleton width={i % 2 === 0 ? 90 : 120} height={16} />
          </div>
        ))}
      </div>
      <div className="dir-settings__col-list">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="dir-settings__col-row">
            <Skeleton width="40%" height={18} />
            <Skeleton width={120} height={24} />
          </div>
        ))}
      </div>
    </div>
  );
}

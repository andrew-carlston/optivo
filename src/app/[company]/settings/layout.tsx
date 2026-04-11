"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentCompany } from "@/features/core/providers/company-provider";
import { useAccess } from "@/features/core/hooks/use-access";
import {
  Settings,
  Building2,
  ClipboardCheck,
  Plug,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/cn";
import "./settings-layout.scss";

const SETTINGS_NAV = [
  { href: "settings", label: "General", icon: Settings, resource: "settings.general" },
  { href: "settings/org", label: "Organization", icon: Building2, resource: "settings.org", stub: true },
  { href: "settings/points", label: "Points & Attendance", icon: ClipboardCheck, resource: "settings.points", stub: true },
  { href: "settings/integrations", label: "Integrations", icon: Plug, resource: "settings.integrations", stub: true },
  { href: "settings/templates", label: "Access Templates", icon: Shield, resource: "settings.templates" },
];

function getActiveKey(pathname: string): string {
  // Match deepest first
  if (pathname.includes("/settings/templates")) return "settings/templates";
  if (pathname.includes("/settings/integrations")) return "settings/integrations";
  if (pathname.includes("/settings/points")) return "settings/points";
  if (pathname.includes("/settings/org")) return "settings/org";
  return "settings";
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const company = useCurrentCompany();
  const { canAccess } = useAccess();
  const pathname = usePathname();
  const slug = company.slug;
  const activeKey = getActiveKey(pathname);

  const visibleNav = SETTINGS_NAV.filter((n) => canAccess(n.resource, "view"));

  return (
    <div className="settings-layout">
      <aside className="settings-layout__sidebar">
        <h3 className="settings-layout__sidebar-title">Settings</h3>
        <nav className="settings-layout__nav">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={`/${slug}/${item.href}`}
                className={cn(
                  "settings-layout__link",
                  activeKey === item.href && "settings-layout__link--active",
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="settings-layout__content">{children}</main>
    </div>
  );
}

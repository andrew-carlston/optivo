"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Shield, Plug, Globe, Tag } from "lucide-react";
import { cn } from "@/lib/cn";
import "../../[company]/settings/settings-layout.scss";

const ADMIN_SETTINGS_NAV = [
  { href: "/admin/settings", label: "General", icon: Settings },
  { href: "/admin/settings/templates", label: "Access Templates", icon: Shield },
  { href: "/admin/settings/tags", label: "Tags & Groups", icon: Tag },
  { href: "/admin/settings/integrations", label: "Integrations", icon: Plug },
  { href: "/admin/settings/platform", label: "Platform", icon: Globe },
];

function getActiveKey(pathname: string): string {
  if (pathname.includes("/settings/templates")) return "/admin/settings/templates";
  if (pathname.includes("/settings/tags")) return "/admin/settings/tags";
  if (pathname.includes("/settings/integrations")) return "/admin/settings/integrations";
  if (pathname.includes("/settings/platform")) return "/admin/settings/platform";
  return "/admin/settings";
}

export default function AdminSettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeKey = getActiveKey(pathname);

  return (
    <div className="settings-layout">
      <aside className="settings-layout__sidebar">
        <h3 className="settings-layout__sidebar-title">Settings</h3>
        <nav className="settings-layout__nav">
          {ADMIN_SETTINGS_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
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

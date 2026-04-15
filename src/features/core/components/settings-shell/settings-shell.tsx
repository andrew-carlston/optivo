"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings,
  Building2,
  ClipboardCheck,
  Plug,
  Shield,
  Users,
  Building,
  Tag,
  CreditCard,
  BarChart3,
  Cog,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useCompanyContext } from "@/features/core/providers/company-provider";
import { useAccess } from "@/features/core/hooks/use-access";
import "./settings-shell.scss";

// ── Nav Definitions ──

type NavItem = {
  href: string;          // relative (company settings) or absolute (platform)
  absolute?: boolean;
  label: string;
  icon: React.ElementType;
  resource?: string;     // for permission gating (company items)
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

// Company settings — shown to every user with access, routed via companyRoute()
const COMPANY_SETTINGS: NavItem[] = [
  { href: "settings", label: "General", icon: Settings, resource: "settings.general" },
  { href: "settings/org", label: "Organization", icon: Building2, resource: "settings.org" },
  { href: "settings/directory", label: "Directory", icon: Users, resource: "settings.general" },
  { href: "settings/points", label: "Points & Attendance", icon: ClipboardCheck, resource: "settings.points" },
  { href: "settings/integrations", label: "Integrations", icon: Plug, resource: "settings.integrations" },
  { href: "settings/templates", label: "Access Templates", icon: Shield, resource: "settings.templates" },
];

// Platform sections — super-only, absolute URLs under /admin/platform/*
const PLATFORM_GROUPS: NavGroup[] = [
  {
    label: "Tenants",
    items: [
      { href: "/admin/platform/companies", absolute: true, label: "Companies", icon: Building },
    ],
  },
  {
    label: "Access",
    items: [
      { href: "/admin/platform/users", absolute: true, label: "Platform Users", icon: Users },
      { href: "/admin/platform/templates", absolute: true, label: "Templates", icon: Shield },
      { href: "/admin/platform/tags", absolute: true, label: "Tags", icon: Tag },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/platform/billing", absolute: true, label: "Billing", icon: CreditCard },
      { href: "/admin/platform/analytics", absolute: true, label: "Analytics", icon: BarChart3 },
      { href: "/admin/platform/integrations", absolute: true, label: "Integrations", icon: Plug },
      { href: "/admin/platform/settings", absolute: true, label: "Settings", icon: Cog },
    ],
  },
];

// Match the deepest segment for active state.
// Returns the full URL to compare against the current pathname.
function isActive(pathname: string, href: string, slug: string, absolute: boolean | undefined): boolean {
  if (absolute) {
    // Exact match or prefix (for nested routes like /admin/platform/templates/[id])
    return pathname === href || pathname.startsWith(href + "/");
  }
  // Company-relative: /{slug}/{href}
  const full = `/${slug}/${href}`;
  if (href === "settings") {
    // Root settings page — only match exact (avoid matching all /settings/*)
    return pathname === full || pathname === full + "/";
  }
  return pathname === full || pathname.startsWith(full + "/");
}

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const { company, isSuper } = useCompanyContext();
  const { canAccess } = useAccess();
  const pathname = usePathname();
  const slug = company.slug;

  const isAdminCompany = slug === "admin";

  // Company settings filtered by permissions
  const visibleCompanyNav = COMPANY_SETTINGS.filter((n) => !n.resource || canAccess(n.resource, "view"));

  // Platform groups — only for super users on the admin company
  const showPlatform = isSuper && isAdminCompany;

  function renderItem(item: NavItem) {
    const active = isActive(pathname, item.href, slug, item.absolute);
    const href = item.absolute ? item.href : (isAdminCompany ? `/admin/${item.href}` : `/${slug}/${item.href}`);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={href}
        className={cn(
          "settings-shell__link",
          active && "settings-shell__link--active",
        )}
      >
        <Icon size={16} />
        {item.label}
      </Link>
    );
  }

  return (
    <div className="settings-shell">
      <aside className="settings-shell__sidebar">
        <div className="settings-shell__section">
          <h3 className="settings-shell__section-title">Settings</h3>
          <nav className="settings-shell__nav">
            {visibleCompanyNav.map(renderItem)}
          </nav>
        </div>

        {showPlatform && PLATFORM_GROUPS.map((group) => (
          <div key={group.label} className="settings-shell__section">
            <h3 className="settings-shell__section-title">{group.label}</h3>
            <nav className="settings-shell__nav">
              {group.items.map(renderItem)}
            </nav>
          </div>
        ))}
      </aside>
      <main className="settings-shell__content">{children}</main>
    </div>
  );
}

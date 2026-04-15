"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  LayoutDashboard,
  Users,
  Radio,
  ClipboardCheck,
  Calendar,
  TrendingUp,
  UserCog,
  DollarSign,
  BarChart3,
  Briefcase,
  Settings,
  ChevronDown,
  LogOut,
  User,
  Shield,
  Menu,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { AppShell } from "@/components/ui/app-shell/app-shell";
import { Header, NavItem } from "@/components/ui/header/header";
import { Footer } from "@/components/ui/footer/footer";
import { Avatar } from "@/components/ui/avatar/avatar";
import { ThemeSwitcher } from "@/components/ui/theme-switcher/theme-switcher";
import { NotificationBell } from "@/components/ui/notification-bell/notification-bell";
import { cn } from "@/lib/cn";
import { signOut } from "@/lib/auth-client";
import { useCompanyContext } from "@/features/core/providers/company-provider";
import { useAccess } from "@/features/core/hooks/use-access";
import "./company-shell.scss";

type NavLink = { href: string; label: string; icon: React.ElementType };

const NAV_GROUPS: { label: string; items: NavLink[] }[] = [
  {
    label: "Workforce",
    items: [
      { href: "realtime", label: "Realtime", icon: Radio },
      { href: "attendance", label: "Attendance", icon: ClipboardCheck },
      { href: "schedule", label: "Schedule", icon: Calendar },
      { href: "forecast", label: "Forecast", icon: TrendingUp },
    ],
  },
  {
    label: "People",
    items: [
      { href: "directory", label: "Directory", icon: Users },
      { href: "hr", label: "HR", icon: Briefcase },
      { href: "staffing", label: "Staffing", icon: UserCog },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "cost", label: "Cost Planning", icon: DollarSign },
      { href: "analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
];


export function CompanyShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { company, user, isSuper, isPlatformUser } = useCompanyContext();
  const { canAccess } = useAccess();
  const slug = company.slug;

  const segments = pathname.split("/").filter(Boolean);
  const activeSegment = segments[1] || "";

  // Expanded state — blocking script in layout sets html.expanded before paint.
  // React state only drives the button icon; CSS reads the html class directly.
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setExpanded(document.documentElement.classList.contains("expanded"));
  }, []);
  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      localStorage.setItem("optivo-expanded", String(next));
      document.documentElement.classList.toggle("expanded", next);
      return next;
    });
  }, []);

  const isAdminCompany = slug === "admin";
  // Platform-admin pages live under /admin/platform/* but are managed from the
  // Settings sidebar (super-only sections). Treat them as "under Settings" for
  // header highlighting.
  const isOnPlatform = segments[0] === "admin" && segments[1] === "platform";

  async function handleSignOut() {
    await signOut();
    window.location.href = isAdminCompany ? "/admin/login" : `/${slug}/login`;
  }

  const isGroupActive = (items: NavLink[]) =>
    items.some((i) => i.href === activeSegment);

  // Filter nav by permissions
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccess(item.href, "view")),
  })).filter((group) => group.items.length > 0);

  // Company routes — /admin/* on admin company, /{slug}/* otherwise
  const companyRoute = (href: string) => isAdminCompany ? `/admin/${href}` : `/${slug}/${href}`;

  const headerNav = (
    <>
      {canAccess("dashboard", "view") && (
        <NavItem href={companyRoute("dashboard")} active={!isOnPlatform && activeSegment === "dashboard"}>
          <LayoutDashboard size={15} />
          Dashboard
        </NavItem>
      )}

      {visibleGroups.map((group) => (
        <DropdownMenu.Root key={group.label}>
          <DropdownMenu.Trigger asChild>
            <button
              className={cn(
                "nav-dropdown__trigger",
                !isOnPlatform && isGroupActive(group.items) && "nav-dropdown__trigger--active"
              )}
            >
              {group.label}
              <ChevronDown size={12} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="nav-dropdown__content" sideOffset={6} align="start">
              {group.items.map(({ href, label, icon: Icon }) => (
                <DropdownMenu.Item
                  key={href}
                  className={cn(
                    "nav-dropdown__item",
                    !isOnPlatform && activeSegment === href && "nav-dropdown__item--active"
                  )}
                  onSelect={() => router.push(companyRoute(href))}
                >
                  <Icon size={15} />
                  {label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      ))}

      {canAccess("settings.general", "view") && (
        <NavItem href={companyRoute("settings")} active={isOnPlatform || activeSegment === "settings"}>
          <Settings size={15} />
          Settings
        </NavItem>
      )}
    </>
  );

  const mobileNav = (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="mobile-menu__trigger">
          <Menu size={18} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="mobile-menu__content" sideOffset={6} align="start">
          {canAccess("dashboard", "view") && (
            <DropdownMenu.Item
              className={cn("nav-dropdown__item", !isOnPlatform && activeSegment === "dashboard" && "nav-dropdown__item--active")}
              onSelect={() => router.push(companyRoute("dashboard"))}
            >
              <LayoutDashboard size={15} />
              Dashboard
            </DropdownMenu.Item>
          )}

          {visibleGroups.map((group) => (
            <DropdownMenu.Group key={group.label}>
              <DropdownMenu.Label className="mobile-menu__label">
                {group.label}
              </DropdownMenu.Label>
              {group.items.map(({ href, label, icon: Icon }) => (
                <DropdownMenu.Item
                  key={href}
                  className={cn("nav-dropdown__item", !isOnPlatform && activeSegment === href && "nav-dropdown__item--active")}
                  onSelect={() => router.push(companyRoute(href))}
                >
                  <Icon size={15} />
                  {label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Group>
          ))}

          {canAccess("settings.general", "view") && (
            <>
              <DropdownMenu.Separator className="user-menu__separator" />
              <DropdownMenu.Item
                className={cn("nav-dropdown__item", (isOnPlatform || activeSegment === "settings") && "nav-dropdown__item--active")}
                onSelect={() => router.push(companyRoute("settings"))}
              >
                <Settings size={15} />
                Settings
              </DropdownMenu.Item>
            </>
          )}

        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );

  const companyLogo = (
    <>
      <Avatar src={company.logoUrl} fallback={company.name} size="sm" />
      <span className="company-logo__name hide-mobile">{company.name}</span>
    </>
  );

  const headerActions = (
    <>
      <ThemeSwitcher />
      <NotificationBell />
      <button
        className="expand-btn hide-mobile"
        onClick={toggleExpanded}
        title={expanded ? "Default width" : "Full width"}
      >
        {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="user-avatar-trigger" title={user.fullName}>
            <Avatar src={user.avatarUrl} fallback={user.fullName} size="sm" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="user-menu__content" sideOffset={6} align="end">
            <div className="user-menu__header">
              <span className="user-menu__name">{user.fullName}</span>
              <span className="user-menu__email">{user.email}</span>
            </div>
            <DropdownMenu.Separator className="user-menu__separator" />
            <DropdownMenu.Item
              className="user-menu__item"
              onSelect={() => router.push(companyRoute("profile"))}
            >
              <User size={15} />
              Profile
            </DropdownMenu.Item>
            {isPlatformUser && !isAdminCompany && (
              <DropdownMenu.Item
                className="user-menu__item"
                onSelect={() => router.push("/admin")}
              >
                <Shield size={15} />
                Admin Panel
              </DropdownMenu.Item>
            )}
            <DropdownMenu.Separator className="user-menu__separator" />
            <DropdownMenu.Item
              className="user-menu__item user-menu__item--danger"
              onSelect={handleSignOut}
            >
              <LogOut size={15} />
              Sign Out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </>
  );

  return (
    <>
      {isPlatformUser && !isAdminCompany && (
        <div className="admin-banner">
          <Shield size={13} />
          <span>Admin session</span>
          <span className="admin-banner__sep" />
          <button className="admin-banner__link" onClick={() => router.push("/admin")}>
            Back to Admin
          </button>
        </div>
      )}
      <AppShell
        header={
          <Header
            logo={companyLogo}
            nav={headerNav}
            mobileNav={mobileNav}
            actions={headerActions}
          />
        }
        footer={<Footer />}
      >
        {children}
      </AppShell>
    </>
  );
}

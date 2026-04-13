"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  LayoutDashboard,
  Building2,
  Shield,
  Users,
  Settings,
  ChevronDown,
  LogOut,
  User,
  Menu,
  Maximize2,
  Minimize2,
  Plug,
  Bell,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { AppShell } from "@/components/ui/app-shell/app-shell";
import { Header, NavItem } from "@/components/ui/header/header";
import { Footer } from "@/components/ui/footer/footer";
import { Avatar } from "@/components/ui/avatar/avatar";
import { ThemeSwitcher } from "@/components/ui/theme-switcher/theme-switcher";
import { NotificationBell } from "@/components/ui/notification-bell/notification-bell";
import { cn } from "@/lib/cn";
import { signOut } from "@/lib/auth-client";
import "./company-shell.scss";

type NavLink = { href: string; label: string; icon: React.ElementType };

const ADMIN_NAV: NavLink[] = [
  { href: "/admin", label: "Companies", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const SUPER_ONLY_PATHS = ["/admin/users", "/admin/billing", "/admin/analytics", "/admin/settings"];

interface AdminShellProps {
  user: { fullName: string; email: string; avatarUrl: string | null };
  isSuper: boolean;
  children: React.ReactNode;
}

export function AdminShell({ user, isSuper, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Redirect non-super users away from super-only routes
  useEffect(() => {
    if (!isSuper && SUPER_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      router.replace("/admin");
    }
  }, [isSuper, pathname, router]);

  // Active segment
  const segments = pathname.split("/").filter(Boolean);
  const activeSegment = segments[1] || ""; // "" = /admin root (companies)

  // Expanded state
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

  async function handleSignOut() {
    await signOut();
    window.location.href = "/admin/login";
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  // Filter nav: non-super users only see Companies
  const visibleNav = isSuper ? ADMIN_NAV : ADMIN_NAV.filter((n) => !SUPER_ONLY_PATHS.includes(n.href));

  // Desktop nav
  const headerNav = (
    <>
      {visibleNav.map(({ href, label, icon: Icon }) => (
        <NavItem key={href} href={href} active={isActive(href)}>
          <Icon size={15} />
          {label}
        </NavItem>
      ))}
    </>
  );

  // Mobile nav
  const mobileNav = (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="mobile-menu__trigger">
          <Menu size={18} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="mobile-menu__content" sideOffset={6} align="start">
          {visibleNav.map(({ href, label, icon: Icon }) => (
            <DropdownMenu.Item
              key={href}
              className={cn("nav-dropdown__item", isActive(href) && "nav-dropdown__item--active")}
              onSelect={() => router.push(href)}
            >
              <Icon size={15} />
              {label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );

  const companyLogo = (
    <>
      <Avatar src={null} fallback="Optivo" size="sm" />
      <span className="company-logo__name hide-mobile">Optivo</span>
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
  );
}

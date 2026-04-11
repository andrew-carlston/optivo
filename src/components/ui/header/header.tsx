"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import "./header.scss";

interface HeaderProps {
  logo?: ReactNode;
  nav?: ReactNode;
  mobileNav?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function Header({ logo, nav, mobileNav, actions, className }: HeaderProps) {
  return (
    <div className={cn("header", className)}>
      <div className="header__left">
        {logo && <div className="header__logo">{logo}</div>}
        {mobileNav && <div className="header__mobile-nav">{mobileNav}</div>}
        {nav && <nav className="header__nav">{nav}</nav>}
      </div>
      {actions && <div className="header__actions">{actions}</div>}
    </div>
  );
}

interface NavItemProps {
  href: string;
  active?: boolean;
  children: ReactNode;
}

export function NavItem({ href, active, children }: NavItemProps) {
  return (
    <Link href={href} className={cn("header__nav-item", active && "header__nav-item--active")}>
      {children}
    </Link>
  );
}

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/Avatar/Avatar'
import Menu, { MenuItem, MenuDivider } from '@/components/Menu/Menu'
import ThemeSwitcher from '@/components/ThemeSwitcher/ThemeSwitcher'
import NotificationIcon, { Notification } from '@/components/NotificationIcon/NotificationIcon'
import { useLayoutSafe } from '@/context/LayoutContext'
import styles from './AppHeader.module.sass'

export interface NavItem {
  id: string
  label: string
  href?: string
}

export interface AppHeaderProps {
  // Left section - Company branding
  companyLogo?: string
  companyName?: string
  companyTagline?: string
  // Center section
  navItems?: NavItem[]
  activeNavItem?: string
  onNavItemClick?: (item: NavItem) => void
  // Right section - User controls
  userAvatar?: string
  userName?: string
  notificationCount?: number
  notifications?: Notification[]
  onNotificationClick?: (notification: Notification) => void
  onViewAllNotifications?: () => void
  onMarkAllNotificationsRead?: () => void
  onSettingsClick?: () => void
  onLogout?: () => void
  // Collapse
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  // Ref
  headerRef?: React.RefObject<HTMLElement | null>
}

const ChevronDownIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const ChevronUpIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
)

const SettingsIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const LogoutIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const HamburgerIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const ExpandIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
)

const CollapseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="4 14 10 14 10 20" />
    <polyline points="20 10 14 10 14 4" />
    <line x1="14" y1="10" x2="21" y2="3" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
)

const AppHeader: React.FC<AppHeaderProps> = ({
  companyLogo,
  companyName,
  companyTagline,
  navItems = [],
  activeNavItem,
  onNavItemClick,
  userAvatar,
  userName = 'User',
  notificationCount = 0,
  notifications = [],
  onNotificationClick,
  onViewAllNotifications,
  onMarkAllNotificationsRead,
  onSettingsClick,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
  headerRef,
}) => {
  const router = useRouter()
  const { isFullWidth, toggleLayoutWidth } = useLayoutSafe()

  const handleNavClick = (item: NavItem) => {
    if (onNavItemClick) {
      onNavItemClick(item)
    } else if (item.href) {
      router.push(item.href)
    }
  }

  const userMenuTrigger = (
    <div className={styles.avatarTrigger}>
      <Avatar src={userAvatar} alt={userName} size="header" />
    </div>
  )

  return (
    <>
      <header
        ref={headerRef as React.RefObject<HTMLElement>}
        className={`${styles.header} ${isCollapsed ? styles.collapsed : ''}`}
      >
        <div className={`${styles.container} ${isFullWidth ? styles.fullWidth : ''}`}>
          {/* Left Section - Company Branding */}
          <div className={styles.leftSection}>
            {companyLogo && (
              <Avatar src={companyLogo} alt={companyName || 'Company logo'} size="header" />
            )}
            <div className={styles.companyInfo}>
              {companyName && (
                <span className={styles.companyName}>{companyName}</span>
              )}
              {companyTagline && (
                <span className={styles.companyTagline}>{companyTagline}</span>
              )}
            </div>
          </div>

          {/* Center Section - Navigation */}
          <nav className={styles.centerSection}>
            {/* Desktop nav items */}
            <div className={styles.desktopNav}>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`${styles.navItem} ${activeNavItem === item.id ? styles.active : ''}`}
                  onClick={() => handleNavClick(item)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Mobile Navigation Menu */}
            {navItems.length > 0 && (
              <div className={styles.hamburgerButton}>
                <Menu
                  trigger={
                    <button className={styles.hamburgerTrigger} aria-label="Navigation menu">
                      <HamburgerIcon />
                    </button>
                  }
                  align="center"
                >
                  {navItems.map((item) => (
                    <MenuItem
                      key={item.id}
                      onClick={() => handleNavClick(item)}
                      active={activeNavItem === item.id}
                    >
                      {item.label}
                    </MenuItem>
                  ))}
                </Menu>
              </div>
            )}
          </nav>

          {/* Right Section - User Controls */}
          <div className={styles.rightSection}>
            {/* Desktop only controls */}
            <div className={styles.desktopControls}>
              <button
                className={styles.layoutToggle}
                onClick={toggleLayoutWidth}
                aria-label={isFullWidth ? 'Use default width' : 'Expand to full width'}
                title={isFullWidth ? 'Use default width (1440px)' : 'Expand to full width'}
              >
                {isFullWidth ? <CollapseIcon /> : <ExpandIcon />}
              </button>
              <ThemeSwitcher />
              <NotificationIcon
                count={notificationCount}
                notifications={notifications}
                onNotificationClick={onNotificationClick}
                onViewAll={onViewAllNotifications}
                onMarkAllRead={onMarkAllNotificationsRead}
              />
            </div>

            <Menu trigger={userMenuTrigger} align="right">
              {/* Mobile only controls */}
              <div className={styles.mobileControls}>
                <div className={styles.mobileControlsRow}>
                  <ThemeSwitcher />
                  <NotificationIcon
                    count={notificationCount}
                    notifications={notifications}
                    onNotificationClick={onNotificationClick}
                    onViewAll={onViewAllNotifications}
                    onMarkAllRead={onMarkAllNotificationsRead}
                  />
                </div>
                <MenuDivider />
              </div>
              <MenuItem onClick={onSettingsClick}>
                <span className={styles.menuIcon}><SettingsIcon /></span>
                Settings
              </MenuItem>
              <MenuDivider />
              <MenuItem onClick={onLogout}>
                <span className={styles.menuIcon}><LogoutIcon /></span>
                Logout
              </MenuItem>
            </Menu>
          </div>
        </div>
      </header>

      {/* Toggle Button - Fixed position */}
      <button
        className={`${styles.toggleButton} ${isCollapsed ? styles.collapsed : ''}`}
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? 'Show header' : 'Hide header'}
        aria-expanded={!isCollapsed}
      >
        {isCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
      </button>
    </>
  )
}

export default AppHeader

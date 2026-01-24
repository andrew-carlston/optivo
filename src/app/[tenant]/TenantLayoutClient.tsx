'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { AppHeader, AppFooter } from '@/components'
import { AppearanceProvider } from '@/context/AppearanceContext'
import { LayoutProvider } from '@/context/LayoutContext'
import { AppearanceSettings, defaultAppearance } from '@/types/appearance'
import type { Notification } from '@/components'
import type { NavItem } from '@/components/AppHeader/AppHeader'
import type { TenantInfo } from './layout'

interface UserInfo {
  id: string
  email: string
  firstName?: string
  lastName?: string
  preferredName?: string
  avatar?: string
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'settings', label: 'Settings', href: '/settings' },
]

function useCollapsibleHeader(threshold = 50) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isManuallyToggled, setIsManuallyToggled] = useState(false)
  const headerRef = useRef<HTMLElement | null>(null)
  const lastScrollY = useRef(0)
  const rafId = useRef<number | null>(null)

  const handleScroll = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current)
    }

    rafId.current = requestAnimationFrame(() => {
      const currentScrollY = window.scrollY
      const atTop = currentScrollY < threshold

      if (atTop) {
        setIsManuallyToggled(false)
        setIsCollapsed(false)
      } else if (!isManuallyToggled) {
        const isScrollingDown = currentScrollY > lastScrollY.current
        const scrollDelta = Math.abs(currentScrollY - lastScrollY.current)

        if (scrollDelta > 10) {
          setIsCollapsed(isScrollingDown)
        }
      }

      lastScrollY.current = currentScrollY
    })
  }, [threshold, isManuallyToggled])

  const toggleCollapse = useCallback(() => {
    setIsManuallyToggled(true)
    setIsCollapsed((prev) => !prev)
  }, [])

  useEffect(() => {
    lastScrollY.current = window.scrollY
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [handleScroll])

  return { isCollapsed, toggleCollapse, headerRef }
}

interface TenantLayoutClientProps {
  children: React.ReactNode
}

export default function TenantLayoutClient({ children }: TenantLayoutClientProps) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const tenantSlug = params.tenant as string

  const { isCollapsed, toggleCollapse, headerRef } = useCollapsibleHeader()

  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [appearance, setAppearance] = useState<AppearanceSettings>(defaultAppearance)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Determine active nav item from pathname
  const activeNavItem = pathname.includes('/settings') ? 'settings' : 'dashboard'

  // Nav items with tenant prefix
  const navItems = DEFAULT_NAV_ITEMS.map((item) => ({
    ...item,
    href: `/${tenantSlug}${item.href}`,
  }))

  // Computed
  const notificationCount = notifications.filter((n) => !n.read).length
  const userName = user?.preferredName || user?.firstName || user?.email?.split('@')[0] || 'User'

  // Load tenant data from script tag
  useEffect(() => {
    const tenantDataScript = document.getElementById('tenant-data')
    if (tenantDataScript) {
      try {
        const data = JSON.parse(tenantDataScript.textContent || '{}')
        setTenant(data)
      } catch (e) {
        console.error('Failed to parse tenant data:', e)
      }
    }
  }, [])

  // Load appearance data from script tag
  useEffect(() => {
    const appearanceDataScript = document.getElementById('appearance-data')
    if (appearanceDataScript) {
      try {
        const data = JSON.parse(appearanceDataScript.textContent || '{}')
        setAppearance(data)
      } catch (e) {
        console.error('Failed to parse appearance data:', e)
        setAppearance(defaultAppearance)
      }
    }
  }, [])

  // Load user data and notifications
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true)
      try {
        const userId = localStorage.getItem('userId')
        if (!userId) {
          router.push(`/${tenantSlug}/sign-in`)
          return
        }

        const response = await fetch(`/api/${tenantSlug}/user?userId=${userId}`)
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        }

        const notifResponse = await fetch(`/api/${tenantSlug}/notifications?userId=${userId}`)
        if (notifResponse.ok) {
          const notifData = await notifResponse.json()
          setNotifications(notifData.notifications || [])
        }
      } catch (error) {
        console.error('Failed to load user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (tenantSlug) {
      loadUserData()
    }
  }, [tenantSlug, router])

  // Handlers
  const handleSettingsClick = useCallback(() => {
    router.push(`/${tenantSlug}/settings`)
  }, [router, tenantSlug])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    router.push(`/${tenantSlug}/sign-in`)
  }, [router, tenantSlug])

  const handleNotificationClick = useCallback((notification: Notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    )
  }, [])

  const handleViewAllNotifications = useCallback(() => {
    router.push(`/${tenantSlug}/notifications`)
  }, [router, tenantSlug])

  const handleMarkAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const handleNavItemClick = useCallback(
    (item: NavItem) => {
      if (item.href) {
        router.push(item.href)
      }
    },
    [router]
  )

  // Don't render header on auth pages
  const isAuthPage = pathname.includes('/sign-in') || pathname.includes('/sign-up') || pathname.includes('/onboarding')

  if (isAuthPage) {
    return (
      <LayoutProvider>
        <AppearanceProvider appearance={appearance}>
          {children}
        </AppearanceProvider>
      </LayoutProvider>
    )
  }

  return (
    <LayoutProvider>
      <AppearanceProvider appearance={appearance}>
        <AppHeader
          headerRef={headerRef}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          userAvatar={user?.avatar}
          userName={userName}
          notificationCount={notificationCount}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onViewAllNotifications={handleViewAllNotifications}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onSettingsClick={handleSettingsClick}
          onLogout={handleLogout}
          navItems={navItems}
          activeNavItem={activeNavItem}
          onNavItemClick={handleNavItemClick}
          companyLogo={tenant?.logo || undefined}
          companyName={tenant?.name}
          companyTagline={tenant?.subtext || undefined}
        />
        {children}
        <AppFooter />
      </AppearanceProvider>
    </LayoutProvider>
  )
}

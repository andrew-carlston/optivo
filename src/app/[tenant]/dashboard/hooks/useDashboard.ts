'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TenantInfo } from '../../layout'
import { NavItem } from '@/components/AppHeader/AppHeader'
import { Notification } from '@/components'

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

export function useDashboard() {
  const params = useParams()
  const router = useRouter()
  const tenantSlug = params.tenant as string

  // State
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [activeNavItem, setActiveNavItem] = useState('dashboard')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Computed
  const notificationCount = notifications.filter(n => !n.read).length

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

        // Load notifications
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

  // Compute display name
  const userName = user?.preferredName || user?.firstName || user?.email?.split('@')[0] || 'User'

  // Nav items with proper hrefs
  const navItems = DEFAULT_NAV_ITEMS.map((item) => ({
    ...item,
    href: item.href ? `/${tenantSlug}${item.href}` : `/${tenantSlug}/dashboard`,
  }))

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
    // Mark as read and navigate if needed
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    )
  }, [])

  const handleViewAllNotifications = useCallback(() => {
    router.push(`/${tenantSlug}/notifications`)
  }, [router, tenantSlug])

  const handleMarkAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const handleNavItemClick = useCallback((item: NavItem) => {
    setActiveNavItem(item.id)
    if (item.href) {
      router.push(item.href)
    }
  }, [router])

  return {
    tenant,
    tenantSlug,
    user,
    userName,
    navItems,
    activeNavItem,
    setActiveNavItem,
    notifications,
    notificationCount,
    isLoading,
    handleSettingsClick,
    handleLogout,
    handleNotificationClick,
    handleViewAllNotifications,
    handleMarkAllNotificationsRead,
    handleNavItemClick,
  }
}

export type UseDashboardReturn = ReturnType<typeof useDashboard>

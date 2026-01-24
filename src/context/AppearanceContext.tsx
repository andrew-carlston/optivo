'use client'

import { createContext, useContext, ReactNode } from 'react'
import { AppearanceSettings, BadgeConfig, defaultAppearance } from '@/types/appearance'

interface AppearanceContextType {
  appearance: AppearanceSettings
  getBadgeConfig: (type: string) => BadgeConfig
  getBadgeColor: (color: string) => { bg: string; text: string }
}

const AppearanceContext = createContext<AppearanceContextType | null>(null)

export function AppearanceProvider({
  children,
  appearance
}: {
  children: ReactNode
  appearance?: AppearanceSettings
}) {
  const settings = appearance || defaultAppearance

  const getBadgeConfig = (type: string): BadgeConfig => {
    return settings.badge_configs[type] || settings.badge_configs.status || defaultAppearance.badge_configs.status
  }

  const getBadgeColor = (color: string): { bg: string; text: string } => {
    return settings.badge_colors[color] || settings.badge_colors.default || defaultAppearance.badge_colors.default
  }

  return (
    <AppearanceContext.Provider value={{ appearance: settings, getBadgeConfig, getBadgeColor }}>
      {children}
    </AppearanceContext.Provider>
  )
}

export function useAppearance() {
  const context = useContext(AppearanceContext)
  if (!context) {
    throw new Error('useAppearance must be used within AppearanceProvider')
  }
  return context
}

/**
 * Safe hook for optional appearance context access.
 * Returns null if not within AppearanceProvider, allowing components
 * to work both inside and outside tenant layouts.
 */
export function useAppearanceSafe() {
  return useContext(AppearanceContext)
}

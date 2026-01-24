'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type LayoutWidth = 'default' | 'full'

interface LayoutContextValue {
  layoutWidth: LayoutWidth
  toggleLayoutWidth: () => void
  isFullWidth: boolean
}

const LayoutContext = createContext<LayoutContextValue | null>(null)

const STORAGE_KEY = 'optivo-layout-width'

interface LayoutProviderProps {
  children: ReactNode
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const [layoutWidth, setLayoutWidth] = useState<LayoutWidth>('default')

  // Load preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'full' || stored === 'default') {
      setLayoutWidth(stored)
    }
  }, [])

  const toggleLayoutWidth = useCallback(() => {
    setLayoutWidth((prev) => {
      const next = prev === 'default' ? 'full' : 'default'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  const value: LayoutContextValue = {
    layoutWidth,
    toggleLayoutWidth,
    isFullWidth: layoutWidth === 'full',
  }

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
}

export function useLayout(): LayoutContextValue {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
}

export function useLayoutSafe(): LayoutContextValue {
  const context = useContext(LayoutContext)
  return context || { layoutWidth: 'default', toggleLayoutWidth: () => {}, isFullWidth: false }
}

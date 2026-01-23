'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemePalette = 'corporate' | 'forest' | 'dracula' | 'forecast'

interface ThemeContextType {
  mode: ThemeMode
  palette: ThemePalette
  resolvedMode: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
  setPalette: (palette: ThemePalette) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY_MODE = 'theme-mode'
const STORAGE_KEY_PALETTE = 'theme-palette'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [palette, setPaletteState] = useState<ThemePalette>('corporate')
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('light')

  // Load saved preferences and apply theme on mount
  useEffect(() => {
    const savedMode = localStorage.getItem(STORAGE_KEY_MODE) as ThemeMode | null
    const savedPalette = localStorage.getItem(STORAGE_KEY_PALETTE) as ThemePalette | null

    const currentMode = savedMode || 'system'
    const currentPalette = savedPalette || 'corporate'

    if (savedMode) setModeState(savedMode)
    if (savedPalette) setPaletteState(savedPalette)

    // Apply theme immediately
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const resolved = currentMode === 'system'
      ? (mediaQuery.matches ? 'dark' : 'light')
      : currentMode

    setResolvedMode(resolved)
    document.documentElement.setAttribute('data-theme', currentPalette)
    document.documentElement.setAttribute('data-mode', resolved)
  }, [])

  // Update theme when mode or palette changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = () => {
      const resolved = mode === 'system'
        ? (mediaQuery.matches ? 'dark' : 'light')
        : mode

      setResolvedMode(resolved)
      document.documentElement.setAttribute('data-theme', palette)
      document.documentElement.setAttribute('data-mode', resolved)
    }

    applyTheme()

    const handleChange = () => {
      if (mode === 'system') {
        applyTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mode, palette])

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem(STORAGE_KEY_MODE, newMode)
  }

  const setPalette = (newPalette: ThemePalette) => {
    setPaletteState(newPalette)
    localStorage.setItem(STORAGE_KEY_PALETTE, newPalette)
  }

  return (
    <ThemeContext.Provider value={{ mode, palette, resolvedMode, setMode, setPalette }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

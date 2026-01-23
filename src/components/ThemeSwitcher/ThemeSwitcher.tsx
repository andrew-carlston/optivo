'use client'

import React from 'react'
import { useTheme, ThemeMode, ThemePalette } from '@/context/ThemeContext'
import Menu, { MenuItem, MenuLabel, MenuDivider } from '@/components/Menu/Menu'
import styles from './ThemeSwitcher.module.sass'

// SVG Icons
const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

const SystemIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
)

const PaletteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
    <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="16" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
  </svg>
)

// Theme color dots
const CorporateIcon = () => <span className={`${styles.colorDot} ${styles.corporate}`} />
const ForestIcon = () => <span className={`${styles.colorDot} ${styles.forest}`} />
const DraculaIcon = () => <span className={`${styles.colorDot} ${styles.dracula}`} />
const ForecastIcon = () => <span className={`${styles.colorDot} ${styles.forecast}`} />

const modeOptions: { value: ThemeMode; icon: React.ReactNode; label: string }[] = [
  { value: 'light', icon: <SunIcon />, label: 'Light' },
  { value: 'dark', icon: <MoonIcon />, label: 'Dark' },
  { value: 'system', icon: <SystemIcon />, label: 'System' },
]

const paletteOptions: { value: ThemePalette; icon: React.ReactNode; label: string }[] = [
  { value: 'corporate', icon: <CorporateIcon />, label: 'Corporate' },
  { value: 'forest', icon: <ForestIcon />, label: 'Forest' },
  { value: 'dracula', icon: <DraculaIcon />, label: 'Dracula' },
  { value: 'forecast', icon: <ForecastIcon />, label: 'Forecast' },
]

export default function ThemeSwitcher() {
  const { mode, palette, setMode, setPalette } = useTheme()

  const triggerButton = (
    <button className={styles.triggerButton} aria-label="Theme settings">
      <PaletteIcon />
    </button>
  )

  return (
    <Menu trigger={triggerButton} align="right">
      <MenuLabel>Mode</MenuLabel>
      {modeOptions.map((option) => (
        <MenuItem
          key={option.value}
          onClick={() => setMode(option.value)}
          active={mode === option.value}
        >
          <span className={styles.icon}>{option.icon}</span>
          <span>{option.label}</span>
        </MenuItem>
      ))}

      <MenuDivider />

      <MenuLabel>Theme</MenuLabel>
      {paletteOptions.map((option) => (
        <MenuItem
          key={option.value}
          onClick={() => setPalette(option.value)}
          active={palette === option.value}
        >
          <span className={styles.icon}>{option.icon}</span>
          <span>{option.label}</span>
        </MenuItem>
      ))}
    </Menu>
  )
}

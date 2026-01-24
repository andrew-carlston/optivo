/**
 * Appearance Types
 *
 * Type definitions for tenant-specific appearance settings,
 * particularly for Badge component configurations.
 */

export interface BadgeConfig {
  shape: 'pill' | 'square' | 'leaf' | 'corner'
  leafSide?: 'left' | 'right'
  cornerPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  fill: 'raised' | 'inset' | 'outline' | 'fill' | 'solid'
  colorEnabled?: boolean
}

export interface BadgeColors {
  [colorName: string]: { bg: string; text: string }
}

export interface AppearanceSettings {
  badge_configs: Record<string, BadgeConfig>
  badge_colors: BadgeColors
  theme_overrides: Record<string, unknown>
}

export const defaultAppearance: AppearanceSettings = {
  badge_configs: {
    status: { shape: 'pill', fill: 'solid', colorEnabled: true },
    tag: { shape: 'square', fill: 'fill', colorEnabled: true },
    priority: { shape: 'pill', fill: 'raised', colorEnabled: true },
    label: { shape: 'leaf', fill: 'outline', leafSide: 'left', colorEnabled: true }
  },
  badge_colors: {
    default: { bg: '#6b7280', text: '#ffffff' },
    primary: { bg: '#3b82f6', text: '#ffffff' },
    success: { bg: '#10b981', text: '#ffffff' },
    warning: { bg: '#f59e0b', text: '#000000' },
    danger: { bg: '#ef4444', text: '#ffffff' },
    info: { bg: '#06b6d4', text: '#ffffff' }
  },
  theme_overrides: {}
}

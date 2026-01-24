'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BadgeConfig, AppearanceSettings, defaultAppearance } from '@/types/appearance'

// ============================================================================
// Types
// ============================================================================

type BadgeShape = 'pill' | 'square' | 'leaf' | 'corner'
type BadgeFill = 'raised' | 'inset' | 'outline' | 'fill' | 'solid'
type LeafSide = 'left' | 'right'
type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface FormErrors {
  general?: string
}

// ============================================================================
// Hook
// ============================================================================

export function useAppearanceSettings() {
  const params = useParams()
  const tenantSlug = params.tenant as string

  // ---------------------------------------------------------------------------
  // STATE: Loading & UI
  // ---------------------------------------------------------------------------
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saveSuccess, setSaveSuccess] = useState(false)

  // ---------------------------------------------------------------------------
  // STATE: Badge Configurations
  // ---------------------------------------------------------------------------
  const [badgeConfigs, setBadgeConfigs] = useState<Record<string, BadgeConfig>>({
    status: { ...defaultAppearance.badge_configs.status },
    tag: { ...defaultAppearance.badge_configs.tag },
    priority: { ...defaultAppearance.badge_configs.priority },
    label: { ...defaultAppearance.badge_configs.label },
  })

  // ---------------------------------------------------------------------------
  // STATE: Original settings for dirty checking
  // ---------------------------------------------------------------------------
  const [originalConfigs, setOriginalConfigs] = useState<Record<string, BadgeConfig> | null>(null)

  // ---------------------------------------------------------------------------
  // COMPUTED: Check if form has unsaved changes
  // ---------------------------------------------------------------------------
  const hasChanges = originalConfigs !== null &&
    JSON.stringify(badgeConfigs) !== JSON.stringify(originalConfigs)

  // ---------------------------------------------------------------------------
  // API: Load appearance settings
  // ---------------------------------------------------------------------------
  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch(`/api/${tenantSlug}/appearance`)

      if (!response.ok) {
        throw new Error('Failed to load appearance settings')
      }

      const { data } = await response.json() as { data: AppearanceSettings }

      const loadedConfigs = {
        status: data.badge_configs?.status || defaultAppearance.badge_configs.status,
        tag: data.badge_configs?.tag || defaultAppearance.badge_configs.tag,
        priority: data.badge_configs?.priority || defaultAppearance.badge_configs.priority,
        label: data.badge_configs?.label || defaultAppearance.badge_configs.label,
      }

      setBadgeConfigs(loadedConfigs)
      setOriginalConfigs(loadedConfigs)
    } catch (error) {
      console.error('Load appearance error:', error)
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to load settings',
      })
    } finally {
      setIsLoading(false)
    }
  }, [tenantSlug])

  // ---------------------------------------------------------------------------
  // EFFECT: Load settings on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // ---------------------------------------------------------------------------
  // HANDLERS: Badge configuration updates
  // ---------------------------------------------------------------------------
  const updateBadgeConfig = useCallback(
    <K extends keyof BadgeConfig>(type: string, field: K, value: BadgeConfig[K]) => {
      setBadgeConfigs((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          [field]: value,
        },
      }))
    },
    []
  )

  const updateShape = useCallback(
    (type: string, shape: BadgeShape) => {
      setBadgeConfigs((prev) => {
        const updated = { ...prev[type], shape }

        // Set default sub-options when shape changes
        if (shape === 'leaf' && !updated.leafSide) {
          updated.leafSide = 'left'
        }
        if (shape === 'corner' && !updated.cornerPosition) {
          updated.cornerPosition = 'top-right'
        }

        // Clear irrelevant sub-options
        if (shape !== 'leaf') {
          delete updated.leafSide
        }
        if (shape !== 'corner') {
          delete updated.cornerPosition
        }

        return { ...prev, [type]: updated }
      })
    },
    []
  )

  const updateFill = useCallback(
    (type: string, fill: BadgeFill) => {
      updateBadgeConfig(type, 'fill', fill)
    },
    [updateBadgeConfig]
  )

  const updateLeafSide = useCallback(
    (type: string, leafSide: LeafSide) => {
      updateBadgeConfig(type, 'leafSide', leafSide)
    },
    [updateBadgeConfig]
  )

  const updateCornerPosition = useCallback(
    (type: string, cornerPosition: CornerPosition) => {
      updateBadgeConfig(type, 'cornerPosition', cornerPosition)
    },
    [updateBadgeConfig]
  )

  const updateColorEnabled = useCallback(
    (type: string, colorEnabled: boolean) => {
      updateBadgeConfig(type, 'colorEnabled', colorEnabled)
    },
    [updateBadgeConfig]
  )

  // ---------------------------------------------------------------------------
  // HANDLER: Save settings
  // ---------------------------------------------------------------------------
  const handleSave = useCallback(async () => {
    if (isSaving) return

    setIsSaving(true)
    setErrors({})
    setSaveSuccess(false)

    try {
      const response = await fetch(`/api/${tenantSlug}/appearance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          badge_configs: badgeConfigs,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      // Update original configs to match saved state
      setOriginalConfigs({ ...badgeConfigs })
      setSaveSuccess(true)

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Save appearance error:', error)
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to save settings',
      })
    } finally {
      setIsSaving(false)
    }
  }, [tenantSlug, badgeConfigs, isSaving])

  // ---------------------------------------------------------------------------
  // HANDLER: Reset to defaults
  // ---------------------------------------------------------------------------
  const handleResetToDefaults = useCallback(() => {
    setBadgeConfigs({
      status: { ...defaultAppearance.badge_configs.status },
      tag: { ...defaultAppearance.badge_configs.tag },
      priority: { ...defaultAppearance.badge_configs.priority },
      label: { ...defaultAppearance.badge_configs.label },
    })
  }, [])

  // ---------------------------------------------------------------------------
  // HANDLER: Discard changes
  // ---------------------------------------------------------------------------
  const handleDiscardChanges = useCallback(() => {
    if (originalConfigs) {
      setBadgeConfigs({ ...originalConfigs })
    }
  }, [originalConfigs])

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------
  return {
    // Loading & UI state
    isLoading,
    isSaving,
    errors,
    saveSuccess,
    hasChanges,

    // Badge configurations
    badgeConfigs,

    // Update handlers
    updateShape,
    updateFill,
    updateLeafSide,
    updateCornerPosition,
    updateColorEnabled,

    // Actions
    handleSave,
    handleResetToDefaults,
    handleDiscardChanges,
  }
}

export type UseAppearanceSettingsReturn = ReturnType<typeof useAppearanceSettings>

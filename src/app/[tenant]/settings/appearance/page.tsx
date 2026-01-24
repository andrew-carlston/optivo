'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components'
import { useAppearanceSettings } from './hooks/useAppearanceSettings'
import { BadgePreview, BadgeConfigSection } from './components'
import styles from './page.module.sass'

const BackArrowIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10 12L6 8L10 4" />
  </svg>
)

export default function AppearanceSettingsPage() {
  const params = useParams()
  const tenantSlug = params.tenant as string

  const appearance = useAppearanceSettings()
  const {
    isLoading,
    isSaving,
    errors,
    saveSuccess,
    hasChanges,
    badgeConfigs,
    updateShape,
    updateFill,
    updateLeafSide,
    updateCornerPosition,
    handleSave,
    handleResetToDefaults,
    handleDiscardChanges,
  } = appearance

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading appearance settings...</span>
        </div>
      </div>
    )
  }

  const badgeTypes = Object.keys(badgeConfigs)

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.container}>
          <Link href={`/${tenantSlug}/settings`} className={styles.backLink}>
            <BackArrowIcon />
            Back to Settings
          </Link>

          <header className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.headerText}>
                <h1>Appearance Settings</h1>
                <p>Customize how badges appear throughout your workspace.</p>
              </div>
            </div>
          </header>

          <div className={styles.content}>
            <BadgePreview badgeConfigs={badgeConfigs} />

            {badgeTypes.map((type) => (
              <BadgeConfigSection
                key={type}
                type={type}
                config={badgeConfigs[type]}
                onShapeChange={updateShape}
                onFillChange={updateFill}
                onLeafSideChange={updateLeafSide}
                onCornerPositionChange={updateCornerPosition}
              />
            ))}

            <div className={styles.footerActions}>
              <div className={styles.footerLeft}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResetToDefaults}
                  disabled={isSaving}
                >
                  Reset to Defaults
                </Button>
                {hasChanges && (
                  <>
                    <span className={styles.unsavedIndicator}>Unsaved changes</span>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleDiscardChanges}
                      disabled={isSaving}
                    >
                      Discard
                    </Button>
                  </>
                )}
              </div>

              <div className={styles.footerRight}>
                {saveSuccess && (
                  <span className={styles.successMessage}>Settings saved successfully</span>
                )}
                {errors.general && (
                  <span className={styles.errorMessage}>{errors.general}</span>
                )}
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

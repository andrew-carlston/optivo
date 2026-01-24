'use client'

import { Badge, Card } from '@/components'
import type { BadgeConfig } from '@/types/appearance'
import { BADGE_COLORS, SAMPLE_BADGE_TEXT, BADGE_TYPE_LABELS } from '../constants'
import styles from '../page.module.sass'

interface BadgePreviewProps {
  badgeConfigs: Record<string, BadgeConfig>
}

export default function BadgePreview({ badgeConfigs }: BadgePreviewProps) {
  const badgeTypes = Object.keys(badgeConfigs)

  return (
    <Card className={styles.previewCard}>
      <div className={styles.previewHeader}>
        <h2>Live Preview</h2>
        <p>See how your badges will appear throughout the application.</p>
      </div>

      <div className={styles.previewSections}>
        {badgeTypes.map((type) => {
          const config = badgeConfigs[type]
          const typeInfo = BADGE_TYPE_LABELS[type]
          const sampleText = SAMPLE_BADGE_TEXT[type] || SAMPLE_BADGE_TEXT.status

          return (
            <div key={type} className={styles.previewSection}>
              <h3 className={styles.previewSectionTitle}>
                {typeInfo?.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Badges`}
              </h3>
              <div className={styles.badgeGrid}>
                {BADGE_COLORS.map((color) => (
                  <Badge
                    key={color}
                    variant={config.shape}
                    fill={config.fill}
                    color={color}
                    leafSide={config.leafSide}
                    cornerPosition={config.cornerPosition}
                  >
                    {sampleText[color] || color}
                  </Badge>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

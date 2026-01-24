'use client'

import { Card, Dropdown } from '@/components'
import type { BadgeConfig } from '@/types/appearance'
import {
  SHAPE_OPTIONS,
  FILL_OPTIONS,
  LEAF_SIDE_OPTIONS,
  CORNER_POSITION_OPTIONS,
  BADGE_TYPE_LABELS,
} from '../constants'
import styles from '../page.module.sass'

interface BadgeConfigSectionProps {
  type: string
  config: BadgeConfig
  onShapeChange: (type: string, shape: BadgeConfig['shape']) => void
  onFillChange: (type: string, fill: BadgeConfig['fill']) => void
  onLeafSideChange: (type: string, leafSide: NonNullable<BadgeConfig['leafSide']>) => void
  onCornerPositionChange: (type: string, cornerPosition: NonNullable<BadgeConfig['cornerPosition']>) => void
}

export default function BadgeConfigSection({
  type,
  config,
  onShapeChange,
  onFillChange,
  onLeafSideChange,
  onCornerPositionChange,
}: BadgeConfigSectionProps) {
  const typeInfo = BADGE_TYPE_LABELS[type]
  const showLeafSide = config.shape === 'leaf'
  const showCornerPosition = config.shape === 'corner'

  return (
    <Card className={styles.configCard}>
      <div className={styles.configHeader}>
        <h3>{typeInfo?.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Configuration`}</h3>
        <p>{typeInfo?.description || 'Configure the appearance of these badges.'}</p>
      </div>

      <div className={styles.configGrid}>
        <div className={styles.configField}>
          <label id={`${type}-shape-label`} className={styles.configLabel}>
            Shape
          </label>
          <Dropdown
            options={[...SHAPE_OPTIONS]}
            value={config.shape}
            onChange={(value) => onShapeChange(type, value as BadgeConfig['shape'])}
            placeholder="Select shape"
            searchable={false}
            aria-labelledby={`${type}-shape-label`}
          />
        </div>

        <div className={styles.configField}>
          <label id={`${type}-fill-label`} className={styles.configLabel}>
            Fill Style
          </label>
          <Dropdown
            options={[...FILL_OPTIONS]}
            value={config.fill}
            onChange={(value) => onFillChange(type, value as BadgeConfig['fill'])}
            placeholder="Select fill"
            searchable={false}
            aria-labelledby={`${type}-fill-label`}
          />
        </div>

        {showLeafSide && (
          <div className={styles.configField}>
            <label id={`${type}-leafside-label`} className={styles.configLabel}>
              Leaf Side
            </label>
            <Dropdown
              options={[...LEAF_SIDE_OPTIONS]}
              value={config.leafSide || 'left'}
              onChange={(value) => onLeafSideChange(type, value as NonNullable<BadgeConfig['leafSide']>)}
              placeholder="Select side"
              searchable={false}
              aria-labelledby={`${type}-leafside-label`}
            />
          </div>
        )}

        {showCornerPosition && (
          <div className={styles.configField}>
            <label id={`${type}-corner-label`} className={styles.configLabel}>
              Corner Position
            </label>
            <Dropdown
              options={[...CORNER_POSITION_OPTIONS]}
              value={config.cornerPosition || 'top-right'}
              onChange={(value) => onCornerPositionChange(type, value as NonNullable<BadgeConfig['cornerPosition']>)}
              placeholder="Select position"
              searchable={false}
              aria-labelledby={`${type}-corner-label`}
            />
          </div>
        )}
      </div>
    </Card>
  )
}

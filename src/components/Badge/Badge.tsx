'use client'

import React from 'react'
import styles from './Badge.module.sass'

type BadgeVariant = 'pill' | 'square' | 'leaf' | 'corner'
type BadgeFill = 'raised' | 'inset' | 'outline' | 'fill' | 'solid'
type BadgeColor = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
type LeafSide = 'left' | 'right'
type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface BadgeProps {
  children: React.ReactNode

  // Shape variants
  variant?: BadgeVariant
  leafSide?: LeafSide        // For leaf variant
  cornerPosition?: CornerPosition  // For corner variant

  // Fill style
  fill?: BadgeFill

  // Color
  color?: BadgeColor

  // Optional features
  icon?: React.ReactNode
  removable?: boolean
  onRemove?: () => void

  className?: string
}

const CloseIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 3L3 9M3 3l6 6" />
  </svg>
)

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'pill',
  fill = 'solid',
  color = 'default',
  icon,
  removable = false,
  onRemove,
  leafSide = 'left',
  cornerPosition = 'top-right',
  className,
}) => {
  const variantClasses: Record<BadgeVariant, string> = {
    pill: styles.pill,
    square: styles.square,
    leaf: leafSide === 'left' ? styles.leafLeft : styles.leafRight,
    corner: styles[`corner${cornerPosition.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}` as keyof typeof styles] || styles.cornerTopRight,
  }

  const fillClasses: Record<BadgeFill, string> = {
    raised: styles.raised,
    inset: styles.inset,
    outline: styles.outline,
    fill: styles.fill,
    solid: styles.solid,
  }

  const colorClasses: Record<BadgeColor, string> = {
    default: styles.colorDefault,
    primary: styles.colorPrimary,
    success: styles.colorSuccess,
    warning: styles.colorWarning,
    danger: styles.colorDanger,
    info: styles.colorInfo,
  }

  const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onRemove?.()
  }

  const handleRemoveKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      onRemove?.()
    }
  }

  return (
    <span
      className={[
        styles.badge,
        variantClasses[variant],
        fillClasses[fill],
        colorClasses[color],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.content}>{children}</span>
      {removable && (
        <button
          type="button"
          className={styles.removeButton}
          onClick={handleRemove}
          onKeyDown={handleRemoveKeyDown}
          aria-label="Remove"
        >
          <CloseIcon />
        </button>
      )}
    </span>
  )
}

export default Badge

'use client'

import React from 'react'
import styles from './FormCard.module.sass'

interface FormCardProps {
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
  className?: string
  maxHeight?: string
  /** Max width: 'default' (1200px), 'full' (100%), or custom pixels */
  maxWidth?: 'default' | 'full' | number
}

const FormCard: React.FC<FormCardProps> = ({
  children,
  header,
  footer,
  onSubmit,
  className,
  maxHeight,
  maxWidth,
}) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit?.(event)
  }

  const formCardClasses = [
    styles.formCard,
    maxWidth === 'default' && styles.formCardDefault,
    maxWidth === 'full' && styles.formCardFull,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // Inline styles
  const inlineStyle: React.CSSProperties = {
    ...(maxHeight ? { maxHeight } : {}),
    ...(typeof maxWidth === 'number' ? { maxWidth: `${maxWidth}px` } : {}),
  }

  return (
    <form
      className={formCardClasses}
      onSubmit={handleSubmit}
      style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
    >
      {header && <div className={styles.header}>{header}</div>}
      <div className={styles.content}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </form>
  )
}

export default FormCard

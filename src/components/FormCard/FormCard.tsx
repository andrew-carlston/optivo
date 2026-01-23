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
}

const FormCard: React.FC<FormCardProps> = ({
  children,
  header,
  footer,
  onSubmit,
  className,
  maxHeight = '80vh'
}) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit?.(event)
  }

  return (
    <form
      className={`${styles.formCard} ${className || ''}`.trim()}
      onSubmit={handleSubmit}
      style={{ maxHeight }}
    >
      {header && (
        <div className={styles.header}>
          {header}
        </div>
      )}
      <div className={styles.content}>
        {children}
      </div>
      {footer && (
        <div className={styles.footer}>
          {footer}
        </div>
      )}
    </form>
  )
}

export default FormCard

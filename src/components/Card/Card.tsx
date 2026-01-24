import React from 'react'
import styles from './Card.module.sass'

interface CardProps {
  children: React.ReactNode
  hoverable?: boolean
  className?: string
  /** Max width: 'default' (1200px), 'full' (100%), or custom pixels */
  maxWidth?: 'default' | 'full' | number
}

const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className,
  maxWidth,
}) => {
  const cardClasses = [
    styles.card,
    hoverable && styles.hoverable,
    maxWidth === 'default' && styles.cardDefault,
    maxWidth === 'full' && styles.cardFull,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // Inline style for custom numeric max-width
  const inlineStyle: React.CSSProperties | undefined =
    typeof maxWidth === 'number' ? { maxWidth: `${maxWidth}px` } : undefined

  return (
    <div className={cardClasses} style={inlineStyle}>
      {children}
    </div>
  )
}

export default Card

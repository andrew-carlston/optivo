'use client'

import React from 'react'
import { useLayoutSafe } from '@/context/LayoutContext'
import styles from './Container.module.sass'

interface ContainerProps {
  children: React.ReactNode
  /** Expand to full width (no max-width constraint) */
  fullWidth?: boolean
  /** Remove padding */
  noPadding?: boolean
  /** Custom className */
  className?: string
  /** Element type */
  as?: 'div' | 'main' | 'section' | 'article'
  /** Ignore global layout width setting */
  ignoreLayoutContext?: boolean
}

const Container: React.FC<ContainerProps> = ({
  children,
  fullWidth = false,
  noPadding = false,
  className,
  as: Component = 'div',
  ignoreLayoutContext = false
}) => {
  const { isFullWidth: globalFullWidth } = useLayoutSafe()

  // Use global setting unless explicitly overridden or ignored
  const isFullWidth = fullWidth || (!ignoreLayoutContext && globalFullWidth)

  const containerClasses = [
    styles.container,
    isFullWidth && styles.fullWidth,
    noPadding && styles.noPadding,
    className
  ].filter(Boolean).join(' ')

  return (
    <Component className={containerClasses}>
      {children}
    </Component>
  )
}

export default Container

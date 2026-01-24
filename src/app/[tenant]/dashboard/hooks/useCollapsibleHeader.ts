'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export function useCollapsibleHeader(threshold = 50) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isAtTop, setIsAtTop] = useState(true)
  const [isManuallyToggled, setIsManuallyToggled] = useState(false)
  const headerRef = useRef<HTMLElement | null>(null)
  const lastScrollY = useRef(0)
  const rafId = useRef<number | null>(null)

  const handleScroll = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current)
    }

    rafId.current = requestAnimationFrame(() => {
      const currentScrollY = window.scrollY
      const atTop = currentScrollY < threshold

      setIsAtTop(atTop)

      // Reset manual toggle when scrolling back to top
      if (atTop) {
        setIsManuallyToggled(false)
        setIsCollapsed(false)
      } else if (!isManuallyToggled) {
        // Auto-collapse/expand based on scroll direction
        const isScrollingDown = currentScrollY > lastScrollY.current
        const scrollDelta = Math.abs(currentScrollY - lastScrollY.current)

        // Only update if scroll delta is significant (prevents jitter)
        if (scrollDelta > 10) {
          setIsCollapsed(isScrollingDown)
        }
      }

      lastScrollY.current = currentScrollY
    })
  }, [threshold, isManuallyToggled])

  const toggleCollapse = useCallback(() => {
    setIsManuallyToggled(true)
    setIsCollapsed(prev => !prev)
  }, [])

  useEffect(() => {
    // Set initial state
    lastScrollY.current = window.scrollY
    setIsAtTop(window.scrollY < threshold)

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [handleScroll, threshold])

  return {
    isCollapsed,
    isAtTop,
    toggleCollapse,
    headerRef,
  }
}

export type UseCollapsibleHeaderReturn = ReturnType<typeof useCollapsibleHeader>

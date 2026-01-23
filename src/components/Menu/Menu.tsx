'use client'

import React, { useState, useRef, useEffect } from 'react'
import styles from './Menu.module.sass'

interface MenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
}

export default function Menu({ trigger, children, align = 'left' }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={styles.menuContainer} ref={menuRef}>
      <div onClick={() => setIsOpen(!isOpen)} className={styles.trigger}>
        {trigger}
      </div>
      {isOpen && (
        <div className={`${styles.menu} ${styles[align]}`}>
          {children}
        </div>
      )}
    </div>
  )
}

interface MenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  active?: boolean
}

export function MenuItem({ children, onClick, active }: MenuItemProps) {
  return (
    <button
      className={`${styles.menuItem} ${active ? styles.active : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <div className={styles.menuLabel}>{children}</div>
}

export function MenuDivider() {
  return <div className={styles.menuDivider} />
}

'use client'

import React from 'react'
import styles from './Toggle.module.sass'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

export default function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md'
}: ToggleProps) {
  return (
    <label className={`${styles.toggle} ${styles[size]} ${disabled ? styles.disabled : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={styles.input}
      />
      <span className={`${styles.slider} ${checked ? styles.checked : ''}`}>
        <span className={styles.knob} />
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  )
}

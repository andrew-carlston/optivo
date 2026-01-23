'use client'

import React from 'react'
import styles from './ToggleSwitch.module.sass'

interface ToggleOption<T extends string> {
  value: T
  icon?: React.ReactNode
  label?: string
}

interface ToggleSwitchProps<T extends string> {
  options: ToggleOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
}

export default function ToggleSwitch<T extends string>({
  options,
  value,
  onChange,
  size = 'md'
}: ToggleSwitchProps<T>) {
  return (
    <div className={`${styles.toggleSwitch} ${styles[size]}`}>
      {options.map((option) => (
        <button
          key={option.value}
          className={`${styles.option} ${value === option.value ? styles.active : ''}`}
          onClick={() => onChange(option.value)}
          title={option.label}
          aria-label={option.label}
        >
          {option.icon || option.label}
        </button>
      ))}
    </div>
  )
}

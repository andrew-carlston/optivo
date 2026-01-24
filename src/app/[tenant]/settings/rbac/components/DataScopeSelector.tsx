'use client'

import React, { useCallback } from 'react'
import { Toggle } from '@/components'
import type { DataScope, ScopeType } from '@/types/rbac'
import { DATA_SCOPE_OPTIONS } from '@/types/rbac'
import styles from '../page.module.sass'

interface DataScopeSelectorProps {
  scope: DataScope
  onChange: (scope: DataScope) => void
}

const SCOPE_OPTIONS: { value: ScopeType; label: string; description: string }[] = DATA_SCOPE_OPTIONS

export default function DataScopeSelector({ scope, onChange }: DataScopeSelectorProps) {
  const handleScopeTypeChange = useCallback((scopeType: ScopeType) => {
    onChange({
      ...scope,
      scopeType
    })
  }, [scope, onChange])

  const handleAdvancedOptionChange = useCallback((key: keyof Omit<DataScope, 'scopeType'>, value: boolean) => {
    onChange({
      ...scope,
      [key]: value
    })
  }, [scope, onChange])

  return (
    <div className={styles.scopeSelector} role="radiogroup" aria-label="Data visibility scope">
      {/* Scope type options */}
      <div className={styles.scopeOptions}>
        {SCOPE_OPTIONS.map((option) => {
          const isSelected = scope.scopeType === option.value

          return (
            <label
              key={option.value}
              className={`${styles.scopeOption} ${isSelected ? styles.scopeOptionSelected : ''}`}
            >
              <input
                type="radio"
                name="scopeType"
                value={option.value}
                checked={isSelected}
                onChange={() => handleScopeTypeChange(option.value)}
                className={styles.scopeRadio}
                aria-describedby={`scope-desc-${option.value}`}
              />
              <div className={styles.scopeOptionContent}>
                <span className={styles.scopeOptionLabel}>{option.label}</span>
                <span
                  id={`scope-desc-${option.value}`}
                  className={styles.scopeOptionDescription}
                >
                  {option.description}
                </span>
              </div>
              <span className={`${styles.scopeIndicator} ${isSelected ? styles.scopeIndicatorActive : ''}`} />
            </label>
          )
        })}
      </div>

      {/* Advanced options */}
      <div className={styles.advancedOptions}>
        <h4 className={styles.advancedOptionsTitle}>Advanced Options</h4>

        <div className={styles.advancedOptionsList}>
          <div className={styles.advancedOption}>
            <Toggle
              checked={scope.includeIndirectReports}
              onChange={(checked) => handleAdvancedOptionChange('includeIndirectReports', checked)}
              label="Include indirect reports"
              size="sm"
              disabled={scope.scopeType === 'self'}
            />
            <span className={styles.advancedOptionHint}>
              Include employees who report to your direct reports
            </span>
          </div>

          <div className={styles.advancedOption}>
            <Toggle
              checked={scope.includeCrossDepartment}
              onChange={(checked) => handleAdvancedOptionChange('includeCrossDepartment', checked)}
              label="Include cross-department team members"
              size="sm"
              disabled={scope.scopeType === 'self'}
            />
            <span className={styles.advancedOptionHint}>
              Include team members from other departments you collaborate with
            </span>
          </div>

          <div className={styles.advancedOption}>
            <Toggle
              checked={scope.excludeTerminated}
              onChange={(checked) => handleAdvancedOptionChange('excludeTerminated', checked)}
              label="Exclude terminated employees"
              size="sm"
            />
            <span className={styles.advancedOptionHint}>
              Hide employees who have been terminated from the directory
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

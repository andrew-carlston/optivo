'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { Toggle } from '@/components'
import type {
  TablePermissions as TablePermissionsType,
  DirectoryTableDefinition,
  SensitivityLevel
} from '@/types/rbac'
import { DIRECTORY_TABLES } from '@/types/rbac'
import styles from '../page.module.sass'

interface TablePermissionsProps {
  permissions: TablePermissionsType
  onChange: (permissions: TablePermissionsType) => void
  parentTablePermissions?: TablePermissionsType
}

/**
 * Returns sensitivity indicator based on level
 */
function getSensitivityIndicator(level: SensitivityLevel): string {
  switch (level) {
    case 'high':
      return '[!]'
    case 'critical':
      return '[!!]'
    default:
      return ''
  }
}

/**
 * Returns sensitivity class name based on level
 */
function getSensitivityClass(level: SensitivityLevel): string {
  switch (level) {
    case 'high':
      return styles.sensitivityHigh
    case 'critical':
      return styles.sensitivityCritical
    default:
      return ''
  }
}

export default function TablePermissions({ permissions, onChange, parentTablePermissions }: TablePermissionsProps) {
  const tables: DirectoryTableDefinition[] = DIRECTORY_TABLES

  // Track last applied parent permissions hash to prevent infinite loops
  const lastAppliedParentPermissionsHashRef = useRef<string | null>(null)

  // Helper to check if parent has table visible
  const parentHasTableVisible = useCallback((tableName: string): boolean => {
    if (!parentTablePermissions) return true  // No parent = no ceiling
    const parentTable = parentTablePermissions[tableName]
    // Parent must have the table AND visible must be true
    if (!parentTable) return false  // Table not defined = no access
    return parentTable.visible === true
  }, [parentTablePermissions])

  // Helper to check if parent has column visible
  const parentHasColumnVisible = useCallback((tableName: string, columnName: string): boolean => {
    if (!parentTablePermissions) return true  // No parent = no ceiling
    const parentTable = parentTablePermissions[tableName]
    if (!parentTable?.visible) return false
    // Parent must have the column AND it must be true
    const parentColumn = parentTable.columns[columnName]
    if (parentColumn === undefined) return false  // Column not defined = no access
    return parentColumn === true
  }, [parentTablePermissions])

  // AUTO-CONSTRAIN: When parent table permissions change, turn off tables/columns parent doesn't have
  useEffect(() => {
    // Skip if no parent permissions constraint
    if (!parentTablePermissions) {
      lastAppliedParentPermissionsHashRef.current = null
      return
    }

    // Create a simple hash of parent permissions for comparison
    const parentHash = JSON.stringify(parentTablePermissions)

    // Skip if we already applied these parent permissions
    if (lastAppliedParentPermissionsHashRef.current === parentHash) return

    let needsUpdate = false
    const constrainedPermissions = { ...permissions }

    // Check each table permission
    for (const tableName of Object.keys(constrainedPermissions)) {
      const tablePermission = constrainedPermissions[tableName]
      const parentHasTable = parentHasTableVisible(tableName)

      // If child has table visible but parent doesn't, turn it off
      if (tablePermission?.visible && !parentHasTable) {
        constrainedPermissions[tableName] = {
          ...tablePermission,
          visible: false,
          columns: Object.fromEntries(
            Object.keys(tablePermission.columns || {}).map(col => [col, false])
          )
        }
        needsUpdate = true
        continue // Skip column checks since table is now disabled
      }

      // Check columns within the table
      if (tablePermission?.visible && tablePermission?.columns) {
        const constrainedColumns = { ...tablePermission.columns }
        let columnsNeedUpdate = false

        for (const columnName of Object.keys(constrainedColumns)) {
          const columnEnabled = constrainedColumns[columnName]
          const parentHasColumn = parentHasColumnVisible(tableName, columnName)

          // If child has column but parent doesn't, turn it off
          if (columnEnabled && !parentHasColumn) {
            constrainedColumns[columnName] = false
            columnsNeedUpdate = true
          }
        }

        if (columnsNeedUpdate) {
          constrainedPermissions[tableName] = {
            ...constrainedPermissions[tableName],
            columns: constrainedColumns
          }
          needsUpdate = true
        }
      }
    }

    // Mark as applied even if no update needed
    lastAppliedParentPermissionsHashRef.current = parentHash

    if (needsUpdate) {
      onChange(constrainedPermissions)
    }
  }, [parentTablePermissions, permissions, onChange, parentHasTableVisible, parentHasColumnVisible])

  const handleTableToggle = useCallback((tableName: string, columns: { name: string }[]) => {
    const current = permissions[tableName] || { visible: false, columns: {} }
    const newVisible = !current.visible

    // CEILING ENFORCEMENT: Prevent enabling if parent doesn't have access
    if (newVisible && !parentHasTableVisible(tableName)) {
      return // Cannot enable - parent doesn't have this table
    }

    // When disabling table, also disable all columns
    // When enabling table, keep columns as-is or enable defaults
    const newColumns: Record<string, boolean> = {}
    columns.forEach(col => {
      newColumns[col.name] = newVisible ? (current.columns[col.name] ?? false) : false
    })

    onChange({
      ...permissions,
      [tableName]: {
        visible: newVisible,
        columns: newColumns
      }
    })
  }, [permissions, onChange, parentHasTableVisible])

  const handleColumnToggle = useCallback((tableName: string, columnName: string) => {
    const current = permissions[tableName] || { visible: false, columns: {} }
    const newColumnValue = !current.columns[columnName]

    // CEILING ENFORCEMENT: Prevent enabling if parent doesn't have access
    if (newColumnValue && !parentHasColumnVisible(tableName, columnName)) {
      return // Cannot enable - parent doesn't have this column
    }

    onChange({
      ...permissions,
      [tableName]: {
        ...current,
        columns: {
          ...current.columns,
          [columnName]: newColumnValue
        }
      }
    })
  }, [permissions, onChange, parentHasColumnVisible])

  return (
    <div className={styles.tableMatrix} role="grid" aria-label="Table and column permissions">
      {/* Header row */}
      <div className={styles.tableMatrixHeader} role="row">
        <div className={styles.tableMatrixHeaderCell} role="columnheader">Table</div>
        <div className={styles.tableMatrixHeaderCell} role="columnheader">Visible</div>
        <div className={styles.tableMatrixHeaderCell} role="columnheader">Columns</div>
      </div>

      {tables.map((table) => {
        const tablePermission = permissions[table.name] || { visible: false, columns: {} }
        const isTableVisible = tablePermission.visible
        const sensitivityIndicator = getSensitivityIndicator(table.sensitivity)
        const sensitivityClass = getSensitivityClass(table.sensitivity)
        const canTableFromParent = parentHasTableVisible(table.name)
        const tableDisabledByParent = !canTableFromParent

        return (
          <div key={table.name} className={styles.tableRow} role="row">
            {/* Table name with sensitivity indicator */}
            <div className={`${styles.tableCell} ${styles.tableCellName}`} role="rowheader">
              <span className={styles.tableName}>{table.displayName}</span>
              {sensitivityIndicator && (
                <span
                  className={`${styles.sensitivityBadge} ${sensitivityClass}`}
                  title={`${table.sensitivity} sensitivity - ${table.description}`}
                  aria-label={`${table.sensitivity} sensitivity`}
                >
                  {sensitivityIndicator}
                </span>
              )}
            </div>

            {/* Table visibility toggle */}
            <div className={`${styles.tableCell} ${styles.tableCellToggle}`} role="gridcell">
              <div
                className={tableDisabledByParent ? styles.permissionDisabled : undefined}
                title={tableDisabledByParent ? "Parent role doesn't have access" : undefined}
                data-tooltip={tableDisabledByParent ? "Parent role doesn't have access" : undefined}
              >
                <Toggle
                  checked={isTableVisible && !tableDisabledByParent}
                  onChange={() => handleTableToggle(table.name, table.columns)}
                  size="sm"
                  disabled={tableDisabledByParent}
                  aria-label={`Toggle ${table.displayName} visibility`}
                />
              </div>
            </div>

            {/* Column toggles */}
            <div className={`${styles.tableCell} ${styles.tableCellColumns}`} role="gridcell">
              <div className={styles.columnGrid}>
                {table.columns.map((column) => {
                  const isColumnEnabled = tablePermission.columns[column.name] ?? false
                  const canColumnFromParent = parentHasColumnVisible(table.name, column.name)
                  const columnDisabledByParent = !canColumnFromParent
                  const isDisabled = !isTableVisible || tableDisabledByParent || columnDisabledByParent

                  return (
                    <label
                      key={column.name}
                      className={`${styles.columnToggle} ${isDisabled ? styles.columnToggleDisabled : ''} ${columnDisabledByParent ? styles.permissionDisabled : ''}`}
                      title={columnDisabledByParent ? "Parent role doesn't have access" : column.description}
                      data-tooltip={columnDisabledByParent ? "Parent role doesn't have access" : undefined}
                    >
                      <input
                        type="checkbox"
                        checked={isColumnEnabled && !columnDisabledByParent}
                        onChange={() => handleColumnToggle(table.name, column.name)}
                        disabled={isDisabled}
                        className={styles.columnCheckbox}
                        aria-label={`${column.displayName} - ${column.description}`}
                      />
                      <span className={styles.columnName}>{column.displayName}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

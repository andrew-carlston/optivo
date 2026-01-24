'use client'

import React, { useCallback, useState, useEffect, useRef } from 'react'
import { Toggle, Dropdown } from '@/components'
import type { PagePermissions as PagePermissionsType, ScopeType, ViewPermissionDetails } from '@/types/rbac'
import type { RegisteredPage } from '@/lib/rbac-registry'
import styles from '../page.module.sass'

interface PagePermissionsProps {
  permissions: PagePermissionsType
  onChange: (permissions: PagePermissionsType) => void
  pages: RegisteredPage[]
  masterScope: ScopeType
  onMasterScopeChange: (scope: ScopeType) => void
  /** Parent role's page permissions for enforcing permission ceiling */
  parentPagePermissions?: PagePermissionsType
  /** Parent role's data scope for enforcing scope ceiling */
  parentScope?: ScopeType
}

const SCOPE_OPTIONS = [
  { value: 'self', label: 'Self Only' },
  { value: 'direct_reports', label: 'Direct Reports' },
  { value: 'department', label: 'Department' },
  { value: 'all', label: 'All Company' },
]

// Scope hierarchy from most restrictive to least restrictive
const SCOPE_HIERARCHY: ScopeType[] = ['self', 'direct_reports', 'department', 'all']

// Helper to check if a scope is allowed based on parent scope ceiling
const isScopeAllowed = (scope: ScopeType, parentScope?: ScopeType) => {
  if (!parentScope) return true
  return SCOPE_HIERARCHY.indexOf(scope) <= SCOPE_HIERARCHY.indexOf(parentScope)
}

// Helper to get the maximum allowed scope (constrained by parent)
const getConstrainedScope = (currentScope: ScopeType, parentScope?: ScopeType): ScopeType => {
  if (!parentScope) return currentScope
  const currentIndex = SCOPE_HIERARCHY.indexOf(currentScope)
  const parentIndex = SCOPE_HIERARCHY.indexOf(parentScope)
  // If current exceeds parent, constrain to parent's level
  if (currentIndex > parentIndex) {
    return parentScope
  }
  return currentScope
}

// Chevron icon for collapse/expand
const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
      transition: 'transform 150ms ease'
    }}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

export default function PagePermissions({
  permissions,
  onChange,
  pages,
  masterScope,
  onMasterScopeChange,
  parentPagePermissions,
  parentScope
}: PagePermissionsProps) {
  const safePermissions = permissions || {}
  const safePages = pages || []

  // Track expanded pages
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set())

  // Track last applied parent scope to prevent infinite loops
  const lastAppliedParentScopeRef = useRef<ScopeType | undefined>(undefined)
  // Track last applied parent permissions hash
  const lastAppliedParentPermissionsHashRef = useRef<string | null>(null)

  // AUTO-CONSTRAIN: When parent scope changes, constrain masterScope to not exceed it
  useEffect(() => {
    // Skip if no parent scope constraint
    if (!parentScope) {
      lastAppliedParentScopeRef.current = undefined
      return
    }

    // Skip if we already applied this parent scope constraint
    if (lastAppliedParentScopeRef.current === parentScope) return

    const constrainedScope = getConstrainedScope(masterScope, parentScope)
    if (constrainedScope !== masterScope) {
      lastAppliedParentScopeRef.current = parentScope
      onMasterScopeChange(constrainedScope)
    } else {
      // Even if no change needed, mark as applied so we don't re-check
      lastAppliedParentScopeRef.current = parentScope
    }
  }, [parentScope, masterScope, onMasterScopeChange])

  // AUTO-CONSTRAIN: When parent page permissions change, turn off pages parent doesn't have
  useEffect(() => {
    // Skip if no parent permissions constraint
    if (!parentPagePermissions) {
      lastAppliedParentPermissionsHashRef.current = null
      return
    }

    // Create a simple hash of parent permissions for comparison
    const parentHash = JSON.stringify(parentPagePermissions)

    // Skip if we already applied these parent permissions
    if (lastAppliedParentPermissionsHashRef.current === parentHash) return

    let needsUpdate = false
    const constrainedPermissions = { ...safePermissions }

    // Check each page permission
    for (const pageName of Object.keys(constrainedPermissions)) {
      const pagePermission = constrainedPermissions[pageName]
      const parentPage = parentPagePermissions[pageName]
      const parentHasAccess = parentPage ? parentPage.access === true : false

      // If child has access but parent doesn't, turn it off
      if (pagePermission?.access && !parentHasAccess) {
        constrainedPermissions[pageName] = { ...pagePermission, access: false }
        needsUpdate = true
      }

      // Also constrain per-page scope if set
      if (pagePermission?.scope && parentScope) {
        const constrainedPageScope = getConstrainedScope(pagePermission.scope, parentScope)
        if (constrainedPageScope !== pagePermission.scope) {
          constrainedPermissions[pageName] = {
            ...constrainedPermissions[pageName],
            scope: constrainedPageScope
          }
          needsUpdate = true
        }
      }

      // Check views within the page
      if (pagePermission?.views && parentHasAccess) {
        const parentViews = parentPagePermissions[pageName]?.views || {}
        const constrainedViews = { ...pagePermission.views }
        let viewsNeedUpdate = false

        for (const viewName of Object.keys(constrainedViews)) {
          const viewPermission = constrainedViews[viewName]
          const viewEnabled = typeof viewPermission === 'boolean' ? viewPermission : viewPermission?.enabled

          // Check if parent has this view
          const parentView = parentViews[viewName]
          const parentHasView = typeof parentView === 'boolean'
            ? parentView
            : (typeof parentView === 'object' ? parentView?.enabled : true)

          // If child has view but parent doesn't, turn it off
          if (viewEnabled && !parentHasView) {
            if (typeof viewPermission === 'boolean') {
              constrainedViews[viewName] = false
            } else {
              constrainedViews[viewName] = { ...viewPermission, enabled: false }
            }
            viewsNeedUpdate = true
          }
        }

        if (viewsNeedUpdate) {
          constrainedPermissions[pageName] = {
            ...constrainedPermissions[pageName],
            views: constrainedViews
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
  }, [parentPagePermissions, parentScope, safePermissions, onChange])

  const togglePageExpanded = useCallback((pageName: string) => {
    setExpandedPages(prev => {
      const next = new Set(prev)
      if (next.has(pageName)) {
        next.delete(pageName)
      } else {
        next.add(pageName)
      }
      return next
    })
  }, [])

  // Helper to check if parent has page access (moved up for use in handlers)
  const parentHasPageAccess = useCallback((pageName: string): boolean => {
    if (!parentPagePermissions) return true  // No parent = no ceiling
    const parentPage = parentPagePermissions[pageName]
    // Parent must have the page AND access must be true
    if (!parentPage) return false  // Page not defined = no access
    return parentPage.access === true
  }, [parentPagePermissions])

  // Helper to check if parent has view access
  const parentHasViewAccess = useCallback((pageName: string, viewName: string): boolean => {
    if (!parentPagePermissions) return true
    const parentPage = parentPagePermissions[pageName]
    if (!parentPage?.access) return false
    const parentView = parentPage.views?.[viewName]
    // Parent must have view and it must be enabled
    if (parentView === undefined) return false  // Not defined = no access
    if (typeof parentView === 'boolean') return parentView === true
    if (typeof parentView === 'object') return parentView.enabled === true
    return false
  }, [parentPagePermissions])

  // Toggle page access on/off
  const handlePageToggle = useCallback((pageName: string, enabled: boolean) => {
    // CEILING ENFORCEMENT: Prevent enabling if parent doesn't have access
    if (enabled && !parentHasPageAccess(pageName)) {
      return // Cannot enable - parent doesn't have this permission
    }

    const currentPermission = safePermissions[pageName] || { access: false, views: {} }

    onChange({
      ...safePermissions,
      [pageName]: {
        ...currentPermission,
        access: enabled
      }
    })

    // Auto-expand when enabled
    if (enabled && !expandedPages.has(pageName)) {
      setExpandedPages(prev => new Set(prev).add(pageName))
    }
  }, [safePermissions, onChange, expandedPages, parentHasPageAccess])

  // Update page scope
  const handlePageScopeChange = useCallback((pageName: string, scope: ScopeType | 'inherit') => {
    const currentPermission = safePermissions[pageName] || { access: false, views: {} }

    const newPermission = { ...currentPermission }
    if (scope === 'inherit') {
      delete newPermission.scope
    } else {
      // CEILING ENFORCEMENT: Constrain scope to parent's ceiling
      const constrainedScope = getConstrainedScope(scope, parentScope)
      newPermission.scope = constrainedScope
    }

    onChange({
      ...safePermissions,
      [pageName]: newPermission
    })
  }, [safePermissions, onChange, parentScope])

  // Toggle view on/off
  const handleViewToggle = useCallback((pageName: string, viewName: string, enabled: boolean) => {
    // CEILING ENFORCEMENT: Prevent enabling if parent doesn't have access
    if (enabled && !parentHasViewAccess(pageName, viewName)) {
      return // Cannot enable - parent doesn't have this view permission
    }

    const currentPermission = safePermissions[pageName] || { access: true, views: {} }
    const currentViews = currentPermission.views || {}
    const currentView = currentViews[viewName]

    // If it was a detailed object, preserve the details
    const newViewValue: ViewPermissionDetails = typeof currentView === 'object'
      ? { ...currentView, enabled }
      : { enabled }

    onChange({
      ...safePermissions,
      [pageName]: {
        ...currentPermission,
        views: {
          ...currentViews,
          [viewName]: newViewValue
        }
      }
    })
  }, [safePermissions, onChange, parentHasViewAccess])

  // Update view permission detail (canEdit, canDelete, canAdd, archive)
  const handleViewDetailChange = useCallback((
    pageName: string,
    viewName: string,
    detail: keyof ViewPermissionDetails,
    value: boolean
  ) => {
    const currentPermission = safePermissions[pageName] || { access: true, views: {} }
    const currentViews = currentPermission.views || {}
    const currentView = currentViews[viewName]

    const viewDetails: ViewPermissionDetails = typeof currentView === 'object'
      ? { ...currentView }
      : { enabled: currentView === true }

    viewDetails[detail] = value

    onChange({
      ...safePermissions,
      [pageName]: {
        ...currentPermission,
        views: {
          ...currentViews,
          [viewName]: viewDetails
        }
      }
    })
  }, [safePermissions, onChange])

  // Helper to get view enabled state
  const isViewEnabled = (pagePermission: PagePermissionsType[string], viewName: string): boolean => {
    const view = pagePermission?.views?.[viewName]
    if (typeof view === 'boolean') return view
    if (typeof view === 'object') return view.enabled
    return false
  }

  // Helper to get view details
  const getViewDetails = (pagePermission: PagePermissionsType[string], viewName: string): ViewPermissionDetails => {
    const view = pagePermission?.views?.[viewName]
    if (typeof view === 'object') return view
    return { enabled: view === true }
  }

  // Generate scope options with parent scope ceiling enforcement
  const getScopeOptionsWithCeiling = (includeInherit: boolean = false) => {
    // Get the effective master scope (constrained by parent)
    const effectiveMasterScope = getConstrainedScope(masterScope, parentScope)

    const options = SCOPE_OPTIONS.map(option => {
      const isDisabled = !isScopeAllowed(option.value as ScopeType, parentScope)
      return {
        ...option,
        disabled: isDisabled,
        disabledTitle: isDisabled ? "Exceeds parent role's data scope" : undefined
      }
    })

    if (includeInherit) {
      return [
        { value: 'inherit', label: `Inherit (${effectiveMasterScope})`, disabled: false },
        ...options
      ]
    }
    return options
  }

  if (safePages.length === 0) {
    return (
      <div className={styles.pagePermissions}>
        <p className={styles.emptyMessage}>
          No pages registered. Add pages using the RBAC registry.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.pagePermissions}>
      {/* Master Scope Setting */}
      <div className={styles.masterScopeSection}>
        <div className={styles.masterScopeHeader}>
          <span className={styles.masterScopeLabel}>Default Data Scope</span>
          <span className={styles.masterScopeHint}>Applied to all pages unless overridden</span>
        </div>
        <Dropdown
          options={getScopeOptionsWithCeiling()}
          value={masterScope}
          onChange={(value) => onMasterScopeChange(value as ScopeType)}
          placeholder="Select scope"
        />
      </div>

      {/* Pages List */}
      <div className={styles.pagesList}>
        {safePages.map((page) => {
          const pagePermission = safePermissions[page.name] || { access: false, views: {} }
          const isExpanded = expandedPages.has(page.name)
          const hasViews = page.views.length > 0
          const pageScope = pagePermission.scope || 'inherit'
          const canAccessFromParent = parentHasPageAccess(page.name)
          const pageDisabledByParent = !canAccessFromParent

          return (
            <div key={page.name} className={styles.pageItem}>
              {/* Page Header */}
              <div className={styles.pageHeader}>
                <button
                  type="button"
                  className={styles.pageExpandBtn}
                  onClick={() => togglePageExpanded(page.name)}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${page.displayName}`}
                  disabled={!pagePermission.access || pageDisabledByParent}
                >
                  <ChevronIcon expanded={isExpanded && pagePermission.access && !pageDisabledByParent} />
                </button>

                <div className={styles.pageInfo}>
                  <span className={styles.pageName}>{page.displayName}</span>
                  <span className={styles.pageDescription}>{page.description}</span>
                </div>

                <div className={styles.pageControls}>
                  {/* Per-page scope dropdown */}
                  {pagePermission.access && !pageDisabledByParent && (
                    <Dropdown
                      options={getScopeOptionsWithCeiling(true)}
                      value={pageScope}
                      onChange={(value) => handlePageScopeChange(page.name, value as ScopeType | 'inherit')}
                      placeholder="Scope"
                    />
                  )}

                  {/* Page toggle */}
                  <div
                    className={pageDisabledByParent ? styles.permissionDisabled : undefined}
                    title={pageDisabledByParent ? "Parent role doesn't have access" : undefined}
                    data-tooltip={pageDisabledByParent ? "Parent role doesn't have access" : undefined}
                  >
                    <Toggle
                      checked={pagePermission.access && !pageDisabledByParent}
                      onChange={(checked) => handlePageToggle(page.name, checked)}
                      size="sm"
                      disabled={pageDisabledByParent}
                    />
                  </div>
                </div>
              </div>

              {/* Views (collapsible) */}
              {hasViews && pagePermission.access && isExpanded && !pageDisabledByParent && (
                <div className={styles.viewsList}>
                  {page.views.map((view) => {
                    const viewEnabled = isViewEnabled(pagePermission, view.name)
                    const viewDetails = getViewDetails(pagePermission, view.name)
                    const canViewFromParent = parentHasViewAccess(page.name, view.name)
                    const viewDisabledByParent = !canViewFromParent

                    return (
                      <div key={view.name} className={styles.viewItem}>
                        <div className={styles.viewHeader}>
                          <div className={styles.viewInfo}>
                            <span className={styles.viewName}>{view.displayName}</span>
                            <span className={styles.viewDescription}>{view.description}</span>
                          </div>
                          <div
                            className={viewDisabledByParent ? styles.permissionDisabled : undefined}
                            title={viewDisabledByParent ? "Parent role doesn't have access" : undefined}
                            data-tooltip={viewDisabledByParent ? "Parent role doesn't have access" : undefined}
                          >
                            <Toggle
                              checked={viewEnabled && !viewDisabledByParent}
                              onChange={(checked) => handleViewToggle(page.name, view.name, checked)}
                              size="sm"
                              disabled={viewDisabledByParent}
                            />
                          </div>
                        </div>

                        {/* View options when enabled */}
                        {viewEnabled && !viewDisabledByParent && (
                          <div className={styles.viewOptions}>
                            <label className={styles.viewOption}>
                              <input
                                type="checkbox"
                                checked={viewDetails.canEdit ?? false}
                                onChange={(e) => handleViewDetailChange(page.name, view.name, 'canEdit', e.target.checked)}
                              />
                              <span>Can Edit</span>
                            </label>
                            <label className={styles.viewOption}>
                              <input
                                type="checkbox"
                                checked={viewDetails.canDelete ?? false}
                                onChange={(e) => handleViewDetailChange(page.name, view.name, 'canDelete', e.target.checked)}
                              />
                              <span>Can Delete</span>
                            </label>
                            <label className={styles.viewOption}>
                              <input
                                type="checkbox"
                                checked={viewDetails.canAdd ?? false}
                                onChange={(e) => handleViewDetailChange(page.name, view.name, 'canAdd', e.target.checked)}
                              />
                              <span>Can Add</span>
                            </label>
                            <label className={styles.viewOption}>
                              <input
                                type="checkbox"
                                checked={viewDetails.archive ?? false}
                                onChange={(e) => handleViewDetailChange(page.name, view.name, 'archive', e.target.checked)}
                              />
                              <span>Archive</span>
                            </label>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

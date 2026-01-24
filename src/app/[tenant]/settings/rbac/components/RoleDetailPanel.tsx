'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button, Input, Dropdown, Toggle, Badge } from '@/components'
import { useAppearanceSafe } from '@/context'
import type {
  RoleWithPermissions,
  RolePermissions,
  PagePermissions as PagePermissionsType,
  TablePermissions as TablePermissionsType,
  ScopeType,
  Role,
  RoleIcon,
  RoleGroup,
  RbacTag
} from '@/types/rbac'
import { VALID_ROLE_ICONS, DEFAULT_PERMISSIONS } from '@/types/rbac'
import { useRbacResources } from '../hooks'
import PagePermissions from './PagePermissions'
import TablePermissions from './TablePermissions'
import styles from '../page.module.sass'

type PermissionTab = 'pages' | 'tables'

interface RoleDetailPanelProps {
  role: RoleWithPermissions
  allRoles?: Role[]
  allGroups?: RoleGroup[]
  availableTags?: RbacTag[]
  onSave: (role: RoleWithPermissions) => Promise<void>
  onBack: () => void
  onCreateTag?: (displayName: string) => Promise<RbacTag | null>
  isLoading?: boolean
  isSaving?: boolean
  parentRole?: Role
  parentPermissions?: RolePermissions
  /** Initial active permission tab (pages/tables) */
  initialTab?: 'pages' | 'tables'
  /** Callback when permission tab changes (for URL sync) */
  onTabChange?: (tab: 'pages' | 'tables') => void
}

const ICON_OPTIONS: { value: RoleIcon; label: string }[] = VALID_ROLE_ICONS.map(icon => ({
  value: icon,
  label: icon.charAt(0).toUpperCase() + icon.slice(1)
}))

const COLOR_PRESETS = [
  '#7c3aed', // Purple
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
]

const TAB_CONFIG: { id: PermissionTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'pages',
    label: 'Pages',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    )
  },
  {
    id: 'tables',
    label: 'Tables',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18"/>
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18"/>
        <path d="M3 15h18"/>
      </svg>
    )
  },
]

export default function RoleDetailPanel({
  role,
  allRoles = [],
  allGroups = [],
  availableTags = [],
  onSave,
  onBack,
  onCreateTag,
  isLoading = false,
  isSaving = false,
  parentRole,
  parentPermissions,
  initialTab = 'pages',
  onTabChange
}: RoleDetailPanelProps) {
  // Fetch dynamic RBAC resources (pages, tables)
  const { pages: registeredPages, tables: registeredTables, isLoading: resourcesLoading } = useRbacResources()

  // Get appearance settings for badges
  const appearance = useAppearanceSafe()
  const badgeConfig = appearance?.getBadgeConfig('status')

  // Local state for editing
  const [displayName, setDisplayName] = useState(role.displayName)
  const [description, setDescription] = useState(role.description || '')
  const [color, setColor] = useState(role.color)
  const [icon, setIcon] = useState<RoleIcon>(role.icon)
  const [groupId, setGroupId] = useState<string | null>(role.groupId || null)
  const [parentRoleId, setParentRoleId] = useState<string | null>(role.parentRoleId)

  // Permissions state
  const [pagePermissions, setPagePermissions] = useState<PagePermissionsType>(role.permissions.pagePermissions)
  const [tablePermissions, setTablePermissions] = useState<TablePermissionsType>(role.permissions.tablePermissions)
  const [masterScope, setMasterScope] = useState<ScopeType>(role.permissions.dataScope?.scopeType || 'all')

  // Sync state when role prop changes (e.g., after API loads fresh data)
  // Include the full role object to detect any property changes, not just id/updatedAt
  React.useEffect(() => {
    setDisplayName(role.displayName)
    setDescription(role.description || '')
    setColor(role.color)
    setIcon(role.icon)
    setGroupId(role.groupId || null)
    setParentRoleId(role.parentRoleId)
    setPagePermissions(role.permissions.pagePermissions)
    setTablePermissions(role.permissions.tablePermissions)
    setMasterScope(role.permissions.dataScope?.scopeType || 'all')
    setTags(role.permissions.tags || [])
    setCascadeToChildren(role.permissions.cascadeToChildren ?? true)
    setInheritFromParent(role.permissions.inheritFromParent ?? true)
  }, [role]) // Re-sync when any role data changes - using full object for proper detection

  // Tags state (for role-assignable tags)
  const [tags, setTags] = useState<string[]>(role.permissions.tags || [])

  // Tags dropdown state
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false)
  const [tagSearch, setTagSearch] = useState('')
  const [tagMenuPosition, setTagMenuPosition] = useState({ top: 0, left: 0, width: 0 })
  const tagTriggerRef = useRef<HTMLButtonElement>(null)
  const tagMenuRef = useRef<HTMLDivElement>(null)
  const tagSearchInputRef = useRef<HTMLInputElement>(null)

  // Filter tags based on search
  const filteredTags = useMemo(() => {
    const activeTags = availableTags.filter(tag => !tag.isArchived)
    if (!tagSearch) return activeTags
    return activeTags.filter(tag =>
      tag.displayName.toLowerCase().includes(tagSearch.toLowerCase())
    )
  }, [availableTags, tagSearch])

  // Check if search term matches any existing tag
  const searchMatchesExistingTag = useMemo(() => {
    return availableTags.some(
      tag => tag.displayName.toLowerCase() === tagSearch.toLowerCase()
    )
  }, [availableTags, tagSearch])

  // Update tag menu position
  const updateTagMenuPosition = useCallback(() => {
    if (tagTriggerRef.current) {
      const rect = tagTriggerRef.current.getBoundingClientRect()
      setTagMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      })
    }
  }, [])

  // Handle click outside to close tags dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedOutsideTrigger = tagTriggerRef.current && !tagTriggerRef.current.contains(target)
      const clickedOutsideMenu = tagMenuRef.current && !tagMenuRef.current.contains(target)

      if (clickedOutsideTrigger && clickedOutsideMenu) {
        setIsTagsDropdownOpen(false)
        setTagSearch('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update position when dropdown opens
  useEffect(() => {
    if (isTagsDropdownOpen) {
      updateTagMenuPosition()
      tagSearchInputRef.current?.focus()

      const handleScrollOrResize = () => updateTagMenuPosition()
      window.addEventListener('scroll', handleScrollOrResize, true)
      window.addEventListener('resize', handleScrollOrResize)

      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true)
        window.removeEventListener('resize', handleScrollOrResize)
      }
    }
  }, [isTagsDropdownOpen, updateTagMenuPosition])

  // Handle tag selection toggle
  const handleTagToggle = useCallback((tagName: string) => {
    setTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    )
  }, [])

  // Handle creating a new tag
  const handleCreateNewTag = useCallback(async () => {
    if (!tagSearch.trim() || !onCreateTag) return

    try {
      const newTag = await onCreateTag(tagSearch.trim())
      if (newTag) {
        setTags(prev => [...prev, newTag.name])
        setTagSearch('')
      }
    } catch {
      // Error handled by parent
    }
  }, [tagSearch, onCreateTag])

  // Remove a selected tag
  const handleRemoveTag = useCallback((tagName: string) => {
    setTags(prev => prev.filter(t => t !== tagName))
  }, [])

  // Cascade options
  const [cascadeToChildren, setCascadeToChildren] = useState(role.permissions.cascadeToChildren ?? true)
  const [inheritFromParent, setInheritFromParent] = useState(role.permissions.inheritFromParent ?? true)

  // Active tab (use initialTab prop for URL-based state restoration)
  const [activeTab, setActiveTab] = useState<PermissionTab>(initialTab)

  // Handle tab change with callback for URL sync
  const handleTabChange = useCallback((tab: PermissionTab) => {
    setActiveTab(tab)
    onTabChange?.(tab)
  }, [onTabChange])

  // Save status
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Detect unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    // Compare current state with original role data
    if (displayName !== role.displayName) return true
    if (description !== (role.description || '')) return true
    if (color !== role.color) return true
    if (icon !== role.icon) return true
    if (groupId !== (role.groupId || null)) return true
    if (parentRoleId !== role.parentRoleId) return true
    if (cascadeToChildren !== (role.permissions.cascadeToChildren ?? true)) return true
    if (inheritFromParent !== (role.permissions.inheritFromParent ?? true)) return true
    if (JSON.stringify(tags) !== JSON.stringify(role.permissions.tags || [])) return true
    if (masterScope !== (role.permissions.dataScope?.scopeType || 'all')) return true
    if (JSON.stringify(pagePermissions) !== JSON.stringify(role.permissions.pagePermissions)) return true
    if (JSON.stringify(tablePermissions) !== JSON.stringify(role.permissions.tablePermissions)) return true
    return false
  }, [
    displayName, description, color, icon, groupId, parentRoleId,
    cascadeToChildren, inheritFromParent, tags, masterScope,
    pagePermissions, tablePermissions, role
  ])

  // Parent role options (exclude self - show roles with higher/equal priority)
  const parentRoleOptions = useMemo(() => {
    const options = [{ value: '', label: 'None (Top-level role)' }]
    allRoles
      .filter(r => r.id !== role.id)
      .sort((a, b) => b.priority - a.priority) // Higher priority first
      .forEach(r => {
        options.push({ value: r.id, label: r.displayName })
      })
    return options
  }, [allRoles, role.id])

  // Group options
  const groupOptions = useMemo(() => {
    const options = [{ value: '', label: 'No Group (Independent)' }]
    allGroups
      .sort((a, b) => b.priority - a.priority)
      .forEach(g => {
        options.push({ value: g.id, label: g.displayName })
      })
    return options
  }, [allGroups])


  const handleSave = useCallback(async () => {
    setSaveError(null)
    setSaveSuccess(false)

    console.log('[RoleDetailPanel] handleSave called, role.id:', role.id)

    // Validate role has ID
    if (!role.id) {
      console.error('[RoleDetailPanel] Error: role.id is missing!', role)
      setSaveError('Role ID is missing - cannot save')
      return
    }

    try {
      const updatedRole: RoleWithPermissions = {
        ...role,
        displayName,
        description: description || null,
        color,
        icon,
        groupId,
        parentRoleId,
        permissions: {
          ...role.permissions,
          pagePermissions,
          tablePermissions,
          dataScope: {
            scopeType: masterScope,
            includeIndirectReports: role.permissions.dataScope?.includeIndirectReports ?? false,
            includeCrossDepartment: role.permissions.dataScope?.includeCrossDepartment ?? false,
            excludeTerminated: role.permissions.dataScope?.excludeTerminated ?? true
          },
          tags,
          cascadeToChildren,
          inheritFromParent
        }
      }
      console.log('[RoleDetailPanel] Calling onSave with updatedRole.id:', updatedRole.id)
      await onSave(updatedRole)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save')
      setTimeout(() => setSaveError(null), 5000)
    }
  }, [
    role, displayName, description, color, icon, groupId, parentRoleId,
    pagePermissions, tablePermissions, masterScope, tags,
    cascadeToChildren, inheritFromParent, onSave
  ])

  const handleDiscard = useCallback(() => {
    // Reset to original values
    setDisplayName(role.displayName)
    setDescription(role.description || '')
    setColor(role.color)
    setIcon(role.icon)
    setGroupId(role.groupId || null)
    setParentRoleId(role.parentRoleId)
    setPagePermissions(role.permissions.pagePermissions)
    setTablePermissions(role.permissions.tablePermissions)
    setMasterScope(role.permissions.dataScope?.scopeType || 'all')
    setTags(role.permissions.tags || [])
    setCascadeToChildren(role.permissions.cascadeToChildren)
    setInheritFromParent(role.permissions.inheritFromParent)
  }, [role])

  const handleResetDefaults = useCallback(() => {
    setPagePermissions(DEFAULT_PERMISSIONS.pagePermissions)
    setTablePermissions(DEFAULT_PERMISSIONS.tablePermissions)
    setMasterScope('all')
    setTags([])
    setCascadeToChildren(DEFAULT_PERMISSIONS.cascadeToChildren)
    setInheritFromParent(DEFAULT_PERMISSIONS.inheritFromParent)
  }, [])

  const isSystemRole = role.isSystemRole

  if (isLoading || resourcesLoading) {
    return (
      <div className={styles.detailPanel}>
        {/* Skeleton Header */}
        <header className={styles.detailPanelHeaderSkeleton}>
          <div className={styles.skeletonBackButton} />
          <div className={styles.detailPanelTitle}>
            <div className={styles.skeletonDot} />
            <div className={styles.skeletonTitleText} />
          </div>
        </header>

        {/* Skeleton Content */}
        <div className={styles.detailPanelContentSkeleton}>
          {/* Left column skeleton */}
          <aside className={styles.detailPanelSettingsSkeleton}>
            <div className={styles.skeletonSectionTitle} />
            <div className={styles.skeletonInputGroup}>
              <div className={styles.skeletonLabel} />
              <div className={styles.skeletonInput} />
            </div>
            <div className={styles.skeletonInputGroup}>
              <div className={styles.skeletonLabel} />
              <div className={styles.skeletonTextarea} />
            </div>
            <div className={styles.skeletonInputGroup}>
              <div className={styles.skeletonLabel} />
              <div className={styles.skeletonColorRow}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={styles.skeletonColorSwatch} />
                ))}
              </div>
            </div>
            <div className={styles.skeletonInputGroup}>
              <div className={styles.skeletonLabel} />
              <div className={styles.skeletonInput} />
            </div>
          </aside>

          {/* Right column skeleton */}
          <main className={styles.detailPanelPermissionsSkeleton}>
            <div className={styles.skeletonSectionTitle} />
            <div className={styles.skeletonTabRow}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={styles.skeletonTab} />
              ))}
            </div>
            <div className={styles.skeletonPermissionList}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={styles.skeletonPermissionItem} />
              ))}
            </div>
          </main>
        </div>

        {/* Skeleton Footer */}
        <footer className={styles.detailPanelFooterSkeleton}>
          <div className={styles.skeletonButton} />
          <div className={styles.footerRight}>
            <div className={styles.skeletonButton} />
            <div className={styles.skeletonButtonWide} />
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className={styles.detailPanel}>
      {/* Header with back button */}
      <header className={styles.detailPanelHeader}>
        <button
          type="button"
          onClick={onBack}
          className={styles.backButton}
          aria-label="Back to roles list"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          <span>Back to Roles</span>
        </button>

        <div className={styles.detailPanelTitle}>
          <span
            className={styles.roleColorDot}
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <h2>{displayName}</h2>
          {isSystemRole && (
            <Badge
              variant={badgeConfig?.shape}
              fill={badgeConfig?.fill}
              color="primary"
              leafSide={badgeConfig?.leafSide}
              cornerPosition={badgeConfig?.cornerPosition}
            >
              System Role
            </Badge>
          )}
        </div>
      </header>

      {/* Main content - two column layout */}
      <div className={styles.detailPanelContent}>
        {/* Left column - Role settings */}
        <aside className={styles.detailPanelSettings}>
          <h3 className={styles.settingsSectionTitle}>Role Settings</h3>

          <div className={styles.settingsForm}>
            <Input
              id="role-name"
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isSystemRole}
            />

            <div className={styles.inputWrapper}>
              <label htmlFor="role-description" className={styles.inputLabel}>
                Description
              </label>
              <textarea
                id="role-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles.textarea}
                rows={3}
                disabled={isSystemRole}
                placeholder="Describe this role's purpose..."
              />
            </div>

            <div className={styles.inputWrapper}>
              <label className={styles.inputLabel}>Color</label>
              <div className={styles.colorPicker}>
                {COLOR_PRESETS.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    className={`${styles.colorSwatch} ${color === presetColor ? styles.colorSwatchActive : ''}`}
                    style={{ backgroundColor: presetColor }}
                    onClick={() => !isSystemRole && setColor(presetColor)}
                    disabled={isSystemRole}
                    aria-label={`Select color ${presetColor}`}
                    aria-pressed={color === presetColor}
                  />
                ))}
              </div>
            </div>

            <div className={styles.inputWrapper}>
              <label className={styles.inputLabel}>Icon</label>
              <Dropdown
                options={ICON_OPTIONS}
                value={icon}
                onChange={(value) => setIcon(value as RoleIcon)}
                disabled={isSystemRole}
              />
            </div>

            <div className={styles.inputWrapper}>
              <label className={styles.inputLabel}>Group</label>
              <Dropdown
                options={groupOptions}
                value={groupId || ''}
                onChange={(value) => setGroupId(value || null)}
                placeholder="No Group (Independent)"
                disabled={isSystemRole}
              />
              <span className={styles.inputHint}>
                Groups share base permissions across all member roles
              </span>
            </div>

            <div className={styles.inputWrapper}>
              <label className={styles.inputLabel}>Reports To</label>
              <Dropdown
                options={parentRoleOptions}
                value={parentRoleId || ''}
                onChange={(value) => setParentRoleId(value || null)}
                placeholder="None (Top-level)"
                disabled={isSystemRole}
              />
              <span className={styles.inputHint}>
                Higher authority role - this role cannot exceed their permissions
              </span>
            </div>
          </div>

          {/* Inheritance options */}
          <div className={styles.cascadeOptions}>
            <h4 className={styles.cascadeOptionsTitle}>Hierarchy</h4>
            <div className={styles.cascadeToggle}>
              <Toggle
                checked={cascadeToChildren && inheritFromParent}
                onChange={(checked) => {
                  setCascadeToChildren(checked)
                  setInheritFromParent(checked)
                }}
                label="Enforce hierarchy restrictions"
                size="sm"
                disabled={isSystemRole}
              />
              <span className={styles.cascadeHint}>
                Permissions are bounded by parent/child relationships
              </span>
            </div>
          </div>

          {/* Tags Management */}
          <div className={styles.tagsSection}>
            <h4 className={styles.tagsSectionTitle}>Assignable Tags</h4>

            {/* Selected tags display */}
            {tags.length > 0 && (
              <div className={styles.selectedTagsList}>
                {tags.map((tagName) => {
                  const tag = availableTags.find(t => t.name === tagName)
                  return (
                    <span key={tagName} className={styles.selectedTag}>
                      {tag?.displayName || tagName}
                      {!isSystemRole && (
                        <button
                          type="button"
                          className={styles.removeTagBtn}
                          onClick={() => handleRemoveTag(tagName)}
                          aria-label={`Remove tag ${tag?.displayName || tagName}`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Tags dropdown trigger */}
            {!isSystemRole && (
              <>
                <button
                  ref={tagTriggerRef}
                  type="button"
                  className={styles.multiSelectTrigger}
                  onClick={() => setIsTagsDropdownOpen(!isTagsDropdownOpen)}
                >
                  <span className={tags.length > 0 ? styles.selected : styles.placeholder}>
                    {tags.length > 0
                      ? `${tags.length} tag${tags.length > 1 ? 's' : ''} selected`
                      : 'Select tags...'}
                  </span>
                  <svg
                    className={`${styles.arrow} ${isTagsDropdownOpen ? styles.rotated : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Tags dropdown menu */}
                {isTagsDropdownOpen && createPortal(
                  <div
                    ref={tagMenuRef}
                    className={styles.multiSelectMenu}
                    style={{
                      position: 'fixed',
                      top: tagMenuPosition.top,
                      left: tagMenuPosition.left,
                      width: tagMenuPosition.width
                    }}
                  >
                    {/* Search input */}
                    <div className={styles.multiSelectSearchWrapper}>
                      <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                      </svg>
                      <input
                        ref={tagSearchInputRef}
                        type="text"
                        className={styles.multiSelectSearchInput}
                        placeholder="Search or create tag..."
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && tagSearch.trim() && !searchMatchesExistingTag && onCreateTag) {
                            e.preventDefault()
                            handleCreateNewTag()
                          }
                        }}
                      />
                    </div>

                    {/* Options list */}
                    <div className={styles.multiSelectOptions}>
                      {filteredTags.length > 0 ? (
                        filteredTags.map((tag) => (
                          <label
                            key={tag.id}
                            className={`${styles.multiSelectOption} ${tags.includes(tag.name) ? styles.multiSelectOptionSelected : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={tags.includes(tag.name)}
                              onChange={() => handleTagToggle(tag.name)}
                              className={styles.multiSelectCheckbox}
                            />
                            <span className={styles.multiSelectOptionLabel}>{tag.displayName}</span>
                          </label>
                        ))
                      ) : tagSearch.trim() ? (
                        onCreateTag ? (
                          <button
                            type="button"
                            className={styles.createTagOption}
                            onClick={handleCreateNewTag}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="12" y1="5" x2="12" y2="19"/>
                              <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Create &quot;{tagSearch.trim()}&quot;
                          </button>
                        ) : (
                          <div className={styles.noResults}>No tags found</div>
                        )
                      ) : (
                        <div className={styles.noResults}>No tags available</div>
                      )}
                    </div>
                  </div>,
                  document.body
                )}

                <span className={styles.inputHint}>
                  Tags help categorize and filter roles
                </span>
              </>
            )}

            {isSystemRole && tags.length === 0 && (
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neo-text-secondary)', margin: '0' }}>
                No tags assigned to this role
              </p>
            )}
          </div>
        </aside>

        {/* Right column - Permissions tabs */}
        <main className={styles.detailPanelPermissions}>
          <h3 className={styles.permissionsSectionTitle}>Permissions</h3>

          {/* Tab navigation */}
          <nav className={styles.permissionTabs} role="tablist" aria-label="Permission categories">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                className={`${styles.permissionTab} ${activeTab === tab.id ? styles.permissionTabActive : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Tab panels */}
          <div className={styles.permissionTabContent}>
            {activeTab === 'pages' && (
              <div
                id="tabpanel-pages"
                role="tabpanel"
                aria-labelledby="tab-pages"
                className={styles.permissionTabPanel}
              >
                <PagePermissions
                  permissions={pagePermissions}
                  onChange={setPagePermissions}
                  pages={registeredPages}
                  masterScope={masterScope}
                  onMasterScopeChange={setMasterScope}
                  parentPagePermissions={parentPermissions?.pagePermissions}
                  parentScope={parentPermissions?.dataScope?.scopeType}
                />
              </div>
            )}

            {activeTab === 'tables' && (
              <div
                id="tabpanel-tables"
                role="tabpanel"
                aria-labelledby="tab-tables"
                className={styles.permissionTabPanel}
              >
                <TablePermissions
                  permissions={tablePermissions}
                  onChange={setTablePermissions}
                  parentTablePermissions={parentPermissions?.tablePermissions}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer with actions */}
      <footer className={styles.detailPanelFooter}>
        <div className={styles.footerLeft}>
          <Button
            variant="ghost"
            onClick={handleResetDefaults}
            disabled={isSystemRole || isSaving}
          >
            Reset Defaults
          </Button>
        </div>

        <div className={styles.footerRight}>
          {saveSuccess && (
            <span className={styles.successMessage}>Changes saved successfully</span>
          )}
          {saveError && (
            <span className={styles.errorMessage}>{saveError}</span>
          )}
          {hasUnsavedChanges && !saveSuccess && !saveError && (
            <span className={styles.unsavedWarning}>Unsaved changes</span>
          )}
          <Button
            variant="ghost"
            onClick={handleDiscard}
            disabled={isSaving || !hasUnsavedChanges}
          >
            Discard
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSystemRole || isSaving || !hasUnsavedChanges}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </footer>
    </div>
  )
}

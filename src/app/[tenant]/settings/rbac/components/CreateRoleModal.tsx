'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Role, RoleIcon, RoleGroup, RbacTag, CreateRoleRequest, VALID_ROLE_ICONS, generateRoleSlug } from '@/types/rbac'
import { Button, Modal, Input, Dropdown, Toggle } from '@/components'
import styles from '../page.module.sass'

interface CreateRoleModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateRoleRequest) => Promise<void>
  existingRoles: Role[]
  existingGroups?: RoleGroup[]
  existingTags?: RbacTag[]
  onCreateTag?: (displayName: string) => Promise<RbacTag | null>
}

// Predefined colors for role selection
const ROLE_COLORS = [
  { value: '#7c3aed', label: 'Purple' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#6b7280', label: 'Gray' }
]

// Icon components for selection
const CrownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M4 21h16" />
  </svg>
)

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const iconComponents: Record<RoleIcon, React.FC> = {
  crown: CrownIcon,
  shield: ShieldIcon,
  briefcase: BriefcaseIcon,
  user: UserIcon,
  eye: EyeIcon,
  lock: LockIcon,
  star: StarIcon
}

interface FormData {
  displayName: string
  description: string
  color: string
  icon: RoleIcon
  groupId: string | null
  parentRoleId: string | null
  isDefault: boolean
  selectedTags: string[]
}

interface FormErrors {
  displayName?: string
  general?: string
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingRoles,
  existingGroups = [],
  existingTags = [],
  onCreateTag
}) => {
  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    description: '',
    color: ROLE_COLORS[0].value,
    icon: 'user',
    groupId: null,
    parentRoleId: null,
    isDefault: false,
    selectedTags: []
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Tags dropdown state
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false)
  const [tagSearch, setTagSearch] = useState('')
  const [tagMenuPosition, setTagMenuPosition] = useState({ top: 0, left: 0, width: 0 })
  const tagTriggerRef = useRef<HTMLButtonElement>(null)
  const tagMenuRef = useRef<HTMLDivElement>(null)
  const tagSearchInputRef = useRef<HTMLInputElement>(null)

  // Filter tags based on search
  const filteredTags = tagSearch
    ? existingTags.filter(tag =>
        tag.displayName.toLowerCase().includes(tagSearch.toLowerCase()) &&
        !tag.isArchived
      )
    : existingTags.filter(tag => !tag.isArchived)

  // Check if search term matches any existing tag
  const searchMatchesExistingTag = existingTags.some(
    tag => tag.displayName.toLowerCase() === tagSearch.toLowerCase()
  )

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
  const handleTagToggle = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagName)
        ? prev.selectedTags.filter(t => t !== tagName)
        : [...prev.selectedTags, tagName]
    }))
  }

  // Handle creating a new tag
  const handleCreateNewTag = async () => {
    if (!tagSearch.trim() || !onCreateTag) return

    try {
      const newTag = await onCreateTag(tagSearch.trim())
      if (newTag) {
        setFormData(prev => ({
          ...prev,
          selectedTags: [...prev.selectedTags, newTag.name]
        }))
        setTagSearch('')
      }
    } catch {
      // Error handled by parent
    }
  }

  // Remove a selected tag
  const handleRemoveTag = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.filter(t => t !== tagName)
    }))
  }

  // Generate parent role options from existing roles (exclude system roles if needed)
  const parentRoleOptions = [
    { value: '', label: 'None (Top-level role)' },
    ...existingRoles
      .filter(role => !role.isSystemRole || role.name === 'super_admin')
      .map(role => ({
        value: role.id,
        label: role.displayName
      }))
  ]

  // Generate group options
  const groupOptions = [
    { value: '', label: 'No Group (Independent)' },
    ...existingGroups.map(group => ({
      value: group.id,
      label: group.displayName
    }))
  ]

  const resetForm = useCallback(() => {
    setFormData({
      displayName: '',
      description: '',
      color: ROLE_COLORS[0].value,
      icon: 'user',
      groupId: null,
      parentRoleId: null,
      isDefault: false,
      selectedTags: []
    })
    setErrors({})
    setIsSubmitting(false)
    setIsTagsDropdownOpen(false)
    setTagSearch('')
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Display name validation
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Role name is required'
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Role name must be at least 2 characters'
    } else if (formData.displayName.trim().length > 50) {
      newErrors.displayName = 'Role name must be less than 50 characters'
    }

    // Check for duplicate names
    const slug = generateRoleSlug(formData.displayName)
    const existingRole = existingRoles.find(
      role => role.name === slug || (role.displayName && role.displayName.toLowerCase() === formData.displayName.trim().toLowerCase())
    )
    if (existingRole) {
      newErrors.displayName = 'A role with this name already exists'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!validateForm()) return
    if (isSubmitting) return

    setIsSubmitting(true)
    setErrors({})

    try {
      const createRoleData: CreateRoleRequest = {
        name: generateRoleSlug(formData.displayName),
        displayName: formData.displayName.trim(),
        description: formData.description.trim() || null,
        color: formData.color,
        icon: formData.icon,
        groupId: formData.groupId || null,
        parentRoleId: formData.parentRoleId || null,
        isDefault: formData.isDefault,
        permissions: {
          tags: formData.selectedTags
        }
      }

      await onSubmit(createRoleData)
      handleClose()
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to create role. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleIconSelect = (icon: RoleIcon) => {
    setFormData(prev => ({ ...prev, icon }))
  }

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, color }))
  }

  const handleParentRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, parentRoleId: value || null }))
  }

  const handleGroupChange = (value: string) => {
    setFormData(prev => ({ ...prev, groupId: value || null }))
  }

  const handleDefaultToggle = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isDefault: checked }))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Role"
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Role'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.formGroup}>
        {/* Display Name */}
        <Input
          id="role-display-name"
          label="Role Name"
          placeholder="e.g., HR Manager"
          value={formData.displayName}
          onChange={handleInputChange('displayName')}
          error={errors.displayName}
          autoFocus
          required
        />

        {/* Description */}
        <Input
          id="role-description"
          label="Description (optional)"
          placeholder="Brief description of this role's purpose"
          value={formData.description}
          onChange={handleInputChange('description')}
        />

        {/* Icon Selector */}
        <div className={styles.iconSelector}>
          <span className={styles.iconSelectorLabel}>Icon</span>
          <div className={styles.iconGrid} role="radiogroup" aria-label="Select role icon">
            {VALID_ROLE_ICONS.map((icon) => {
              const IconComponent = iconComponents[icon]
              return (
                <button
                  key={icon}
                  type="button"
                  className={`${styles.iconOption} ${formData.icon === icon ? styles.iconOptionSelected : ''}`}
                  onClick={() => handleIconSelect(icon)}
                  aria-checked={formData.icon === icon}
                  role="radio"
                  aria-label={icon}
                  style={formData.icon === icon ? { color: formData.color } : undefined}
                >
                  <IconComponent />
                </button>
              )
            })}
          </div>
        </div>

        {/* Color Selector */}
        <div className={styles.colorSelector}>
          <span className={styles.colorSelectorLabel}>Color</span>
          <div className={styles.colorGrid} role="radiogroup" aria-label="Select role color">
            {ROLE_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                className={`${styles.colorOption} ${formData.color === color.value ? styles.colorOptionSelected : ''}`}
                onClick={() => handleColorSelect(color.value)}
                aria-checked={formData.color === color.value}
                role="radio"
                aria-label={color.label}
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
        </div>

        {/* Group Selector */}
        {groupOptions.length > 1 && (
          <div>
            <label
              htmlFor="group-dropdown"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                color: 'var(--neo-text-primary)',
                marginBottom: 'var(--spacing-2)'
              }}
            >
              Group (optional)
            </label>
            <Dropdown
              options={groupOptions}
              value={formData.groupId || ''}
              onChange={handleGroupChange}
              placeholder="No Group (Independent)"
              searchable={groupOptions.length > 5}
            />
            <p style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--neo-text-secondary)',
              marginTop: 'var(--spacing-1)'
            }}>
              Groups share base permissions across all member roles
            </p>
          </div>
        )}

        {/* Parent Role Selector */}
        <div>
          <label
            htmlFor="parent-role-dropdown"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
              color: 'var(--neo-text-primary)',
              marginBottom: 'var(--spacing-2)'
            }}
          >
            Reports To (optional)
          </label>
          <Dropdown
            options={parentRoleOptions}
            value={formData.parentRoleId || ''}
            onChange={handleParentRoleChange}
            placeholder="None (Top-level role)"
            searchable={parentRoleOptions.length > 5}
          />
          <p style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--neo-text-secondary)',
            marginTop: 'var(--spacing-1)'
          }}>
            Higher authority role - this role cannot exceed their permissions
          </p>
        </div>

        {/* Default Role Toggle */}
        <div className={styles.checkboxGroup}>
          <Toggle
            checked={formData.isDefault}
            onChange={handleDefaultToggle}
            size="sm"
          />
          <div>
            <span className={styles.checkboxLabel}>Set as default role</span>
            <p className={styles.checkboxDescription}>
              New users will automatically be assigned this role
            </p>
          </div>
        </div>

        {/* Tags Multi-Select */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
              color: 'var(--neo-text-primary)',
              marginBottom: 'var(--spacing-2)'
            }}
          >
            Tags (optional)
          </label>

          {/* Selected tags display */}
          {formData.selectedTags.length > 0 && (
            <div className={styles.selectedTagsList}>
              {formData.selectedTags.map((tagName) => {
                const tag = existingTags.find(t => t.name === tagName)
                return (
                  <span key={tagName} className={styles.selectedTag}>
                    {tag?.displayName || tagName}
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
                  </span>
                )
              })}
            </div>
          )}

          {/* Tags dropdown trigger */}
          <button
            ref={tagTriggerRef}
            type="button"
            className={styles.multiSelectTrigger}
            onClick={() => setIsTagsDropdownOpen(!isTagsDropdownOpen)}
          >
            <span className={formData.selectedTags.length > 0 ? styles.selected : styles.placeholder}>
              {formData.selectedTags.length > 0
                ? `${formData.selectedTags.length} tag${formData.selectedTags.length > 1 ? 's' : ''} selected`
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
                      className={`${styles.multiSelectOption} ${formData.selectedTags.includes(tag.name) ? styles.multiSelectOptionSelected : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedTags.includes(tag.name)}
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

          <p style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--neo-text-secondary)',
            marginTop: 'var(--spacing-1)'
          }}>
            Tags help categorize and filter roles
          </p>
        </div>

        {/* General Error Message */}
        {errors.general && (
          <div className={styles.errorMessage} role="alert">
            {errors.general}
          </div>
        )}
      </form>
    </Modal>
  )
}

export default CreateRoleModal

'use client'

import React, { useState, useCallback } from 'react'
import { RoleGroup, RoleIcon, CreateGroupRequest, VALID_ROLE_ICONS } from '@/types/rbac'
import { Button, Modal, Input, Dropdown } from '@/components'
import styles from '../page.module.sass'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateGroupRequest) => Promise<void>
  existingGroups: RoleGroup[]
}

// Predefined colors for group selection
const GROUP_COLORS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
]

// Icon components for selection
const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const CrownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M4 21h16" />
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

const iconComponents: Record<RoleIcon, React.FC> = {
  crown: CrownIcon,
  shield: ShieldIcon,
  briefcase: BriefcaseIcon,
  user: UserIcon,
  eye: EyeIcon,
  lock: LockIcon,
  star: StarIcon
}

function generateGroupSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

interface FormData {
  displayName: string
  description: string
  color: string
  icon: RoleIcon
}

interface FormErrors {
  displayName?: string
  general?: string
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingGroups
}) => {
  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    description: '',
    color: GROUP_COLORS[0].value,
    icon: 'briefcase'
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = useCallback(() => {
    setFormData({
      displayName: '',
      description: '',
      color: GROUP_COLORS[0].value,
      icon: 'briefcase'
    })
    setErrors({})
    setIsSubmitting(false)
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Display name validation
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Group name is required'
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Group name must be at least 2 characters'
    } else if (formData.displayName.trim().length > 50) {
      newErrors.displayName = 'Group name must be less than 50 characters'
    }

    // Check for duplicate names
    const slug = generateGroupSlug(formData.displayName)
    const existingGroup = existingGroups.find(
      group => group.name === slug || group.displayName.toLowerCase() === formData.displayName.trim().toLowerCase()
    )
    if (existingGroup) {
      newErrors.displayName = 'A group with this name already exists'
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
      const createGroupData: CreateGroupRequest = {
        name: generateGroupSlug(formData.displayName),
        displayName: formData.displayName.trim(),
        description: formData.description.trim() || null,
        color: formData.color,
        icon: formData.icon
      }

      await onSubmit(createGroupData)
      handleClose()
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to create group. Please try again.'
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Group"
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
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.formGroup}>
        {/* Display Name */}
        <Input
          id="group-display-name"
          label="Group Name"
          placeholder="e.g., Human Resources"
          value={formData.displayName}
          onChange={handleInputChange('displayName')}
          error={errors.displayName}
          autoFocus
          required
        />

        {/* Description */}
        <Input
          id="group-description"
          label="Description (optional)"
          placeholder="Brief description of this group's purpose"
          value={formData.description}
          onChange={handleInputChange('description')}
        />

        {/* Icon Selector */}
        <div className={styles.iconSelector}>
          <span className={styles.iconSelectorLabel}>Icon</span>
          <div className={styles.iconGrid} role="radiogroup" aria-label="Select group icon">
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
          <div className={styles.colorGrid} role="radiogroup" aria-label="Select group color">
            {GROUP_COLORS.map((color) => (
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

        {/* Info text */}
        <p style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--neo-text-secondary)',
          margin: 'var(--spacing-2) 0 0'
        }}>
          Groups allow you to organize roles and share base permissions across all member roles.
        </p>

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

export default CreateGroupModal

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button, Modal, Input } from '@/components'
import { RoleGroup, CreateGroupRequest, UpdateGroupRequest, RoleIcon, VALID_ROLE_ICONS } from '@/types/rbac'
import { RbacTag, CreateTagRequest, UpdateTagRequest } from '@/types/rbac'
import styles from '../page.module.sass'

// ============================================================================
// Types
// ============================================================================

interface ManageTagsGroupsModalProps {
  isOpen: boolean
  onClose: () => void
  // Groups
  groups: RoleGroup[]
  onCreateGroup: (data: CreateGroupRequest) => Promise<void>
  onUpdateGroup: (groupId: string, data: UpdateGroupRequest) => Promise<void>
  onDeleteGroup: (groupId: string) => Promise<void>
  isGroupSaving?: boolean
  // Tags
  tags: RbacTag[]
  onCreateTag: (data: CreateTagRequest) => Promise<void>
  onUpdateTag: (tagId: string, data: UpdateTagRequest) => Promise<void>
  onDeleteTag: (tagId: string) => Promise<void>
  isTagSaving?: boolean
}

type TabType = 'groups' | 'tags'

// ============================================================================
// Icons
// ============================================================================

const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)

const TagIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const ArchiveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const RestoreIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// Icon components for group icon selection
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

// Predefined colors
const COLORS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
]

// ============================================================================
// Component
// ============================================================================

const ManageTagsGroupsModal: React.FC<ManageTagsGroupsModalProps> = ({
  isOpen,
  onClose,
  groups,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  isGroupSaving = false,
  tags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  isTagSaving = false
}) => {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('groups')
  const [showArchived, setShowArchived] = useState(false)

  // Group form state
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [groupFormData, setGroupFormData] = useState({ displayName: '', description: '', color: COLORS[0].value, icon: 'briefcase' as RoleIcon })
  const [groupError, setGroupError] = useState<string | null>(null)
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null)

  // Tag form state
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [tagFormData, setTagFormData] = useState({ displayName: '', description: '' })
  const [tagError, setTagError] = useState<string | null>(null)
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsAddingGroup(false)
      setEditingGroupId(null)
      setGroupFormData({ displayName: '', description: '', color: COLORS[0].value, icon: 'briefcase' })
      setGroupError(null)
      setDeletingGroupId(null)
      setIsAddingTag(false)
      setEditingTagId(null)
      setTagFormData({ displayName: '', description: '' })
      setTagError(null)
      setDeletingTagId(null)
    }
  }, [isOpen])

  // ---------------------------------------------------------------------------
  // Group Handlers
  // ---------------------------------------------------------------------------

  const handleStartAddGroup = useCallback(() => {
    setIsAddingGroup(true)
    setEditingGroupId(null)
    setGroupFormData({ displayName: '', description: '', color: COLORS[0].value, icon: 'briefcase' })
    setGroupError(null)
  }, [])

  const handleStartEditGroup = useCallback((group: RoleGroup) => {
    setEditingGroupId(group.id)
    setIsAddingGroup(false)
    setGroupFormData({
      displayName: group.displayName,
      description: group.description || '',
      color: group.color,
      icon: group.icon
    })
    setGroupError(null)
  }, [])

  const handleCancelGroupForm = useCallback(() => {
    setIsAddingGroup(false)
    setEditingGroupId(null)
    setGroupFormData({ displayName: '', description: '', color: COLORS[0].value, icon: 'briefcase' })
    setGroupError(null)
  }, [])

  const handleSaveGroup = useCallback(async () => {
    if (!groupFormData.displayName.trim()) {
      setGroupError('Name is required')
      return
    }
    if (groupFormData.displayName.trim().length < 2) {
      setGroupError('Name must be at least 2 characters')
      return
    }

    try {
      if (editingGroupId) {
        await onUpdateGroup(editingGroupId, {
          displayName: groupFormData.displayName.trim(),
          description: groupFormData.description.trim() || null,
          color: groupFormData.color,
          icon: groupFormData.icon
        })
      } else {
        const displayNameTrimmed = groupFormData.displayName.trim()
        const name = displayNameTrimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
        await onCreateGroup({
          name,
          displayName: displayNameTrimmed,
          description: groupFormData.description.trim() || null,
          color: groupFormData.color,
          icon: groupFormData.icon
        })
      }
      handleCancelGroupForm()
    } catch (err) {
      setGroupError(err instanceof Error ? err.message : 'Failed to save group')
    }
  }, [groupFormData, editingGroupId, onCreateGroup, onUpdateGroup, handleCancelGroupForm])

  const handleDeleteGroup = useCallback(async (groupId: string) => {
    try {
      await onDeleteGroup(groupId)
      setDeletingGroupId(null)
    } catch (err) {
      setGroupError(err instanceof Error ? err.message : 'Failed to delete group')
    }
  }, [onDeleteGroup])

  // ---------------------------------------------------------------------------
  // Tag Handlers
  // ---------------------------------------------------------------------------

  const handleStartAddTag = useCallback(() => {
    setIsAddingTag(true)
    setEditingTagId(null)
    setTagFormData({ displayName: '', description: '' })
    setTagError(null)
  }, [])

  const handleStartEditTag = useCallback((tag: RbacTag) => {
    setEditingTagId(tag.id)
    setIsAddingTag(false)
    setTagFormData({
      displayName: tag.displayName,
      description: tag.description || ''
    })
    setTagError(null)
  }, [])

  const handleCancelTagForm = useCallback(() => {
    setIsAddingTag(false)
    setEditingTagId(null)
    setTagFormData({ displayName: '', description: '' })
    setTagError(null)
  }, [])

  const handleSaveTag = useCallback(async () => {
    if (!tagFormData.displayName.trim()) {
      setTagError('Name is required')
      return
    }
    if (tagFormData.displayName.trim().length < 2) {
      setTagError('Name must be at least 2 characters')
      return
    }

    try {
      if (editingTagId) {
        await onUpdateTag(editingTagId, {
          displayName: tagFormData.displayName.trim(),
          description: tagFormData.description.trim() || null
        })
      } else {
        await onCreateTag({
          displayName: tagFormData.displayName.trim(),
          description: tagFormData.description.trim() || null
        })
      }
      handleCancelTagForm()
    } catch (err) {
      setTagError(err instanceof Error ? err.message : 'Failed to save tag')
    }
  }, [tagFormData, editingTagId, onCreateTag, onUpdateTag, handleCancelTagForm])

  const handleArchiveTag = useCallback(async (tagId: string, isArchived: boolean) => {
    try {
      await onUpdateTag(tagId, { isArchived: !isArchived })
    } catch (err) {
      setTagError(err instanceof Error ? err.message : 'Failed to archive tag')
    }
  }, [onUpdateTag])

  const handleDeleteTag = useCallback(async (tagId: string) => {
    try {
      await onDeleteTag(tagId)
      setDeletingTagId(null)
    } catch (err) {
      setTagError(err instanceof Error ? err.message : 'Failed to delete tag')
    }
  }, [onDeleteTag])

  // ---------------------------------------------------------------------------
  // Filter tags based on archive state
  // ---------------------------------------------------------------------------
  const filteredTags = showArchived ? tags : tags.filter(t => !t.isArchived)
  const archivedCount = tags.filter(t => t.isArchived).length

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Tags & Groups"
      size="lg"
    >
      {/* Tabs */}
      <div className={styles.manageTabs}>
        <button
          type="button"
          className={`${styles.manageTab} ${activeTab === 'groups' ? styles.manageTabActive : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          <FolderIcon />
          Groups
          <span className={styles.manageTabCount}>{groups.length}</span>
        </button>
        <button
          type="button"
          className={`${styles.manageTab} ${activeTab === 'tags' ? styles.manageTabActive : ''}`}
          onClick={() => setActiveTab('tags')}
        >
          <TagIcon />
          Tags
          <span className={styles.manageTabCount}>{tags.filter(t => !t.isArchived).length}</span>
        </button>
      </div>

      {/* Groups Tab Content */}
      {activeTab === 'groups' && (
        <div className={styles.manageContent}>
          {/* Header with Add button */}
          <div className={styles.manageHeader}>
            <p className={styles.manageDescription}>
              Groups help organize roles and can share base permissions.
            </p>
            {!isAddingGroup && !editingGroupId && (
              <Button variant="ghost"  onClick={handleStartAddGroup}>
                <PlusIcon />
                Add Group
              </Button>
            )}
          </div>

          {/* Add Group Form */}
          {isAddingGroup && (
            <div className={styles.manageItemForm}>
              <div className={styles.manageItemFormFields}>
                <Input
                  id="new-group-name"
                  label="Group Name"
                  placeholder="e.g., Human Resources"
                  value={groupFormData.displayName}
                  onChange={(e) => setGroupFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  error={groupError || undefined}
                  autoFocus
                />
                <Input
                  id="new-group-description"
                  label="Description (optional)"
                  placeholder="Brief description"
                  value={groupFormData.description}
                  onChange={(e) => setGroupFormData(prev => ({ ...prev, description: e.target.value }))}
                />
                <div className={styles.manageFormRow}>
                  <div className={styles.iconSelector}>
                    <span className={styles.iconSelectorLabel}>Icon</span>
                    <div className={styles.iconGrid}>
                      {VALID_ROLE_ICONS.map((icon) => {
                        const IconComponent = iconComponents[icon]
                        return (
                          <button
                            key={icon}
                            type="button"
                            className={`${styles.iconOption} ${groupFormData.icon === icon ? styles.iconOptionSelected : ''}`}
                            onClick={() => setGroupFormData(prev => ({ ...prev, icon }))}
                            style={groupFormData.icon === icon ? { color: groupFormData.color } : undefined}
                          >
                            <IconComponent />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className={styles.colorSelector}>
                    <span className={styles.colorSelectorLabel}>Color</span>
                    <div className={styles.colorGrid}>
                      {COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`${styles.colorOption} ${groupFormData.color === color.value ? styles.colorOptionSelected : ''}`}
                          onClick={() => setGroupFormData(prev => ({ ...prev, color: color.value }))}
                          style={{ backgroundColor: color.value }}
                          aria-label={color.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.manageItemFormActions}>
                <Button variant="ghost"  onClick={handleCancelGroupForm} disabled={isGroupSaving}>
                  Cancel
                </Button>
                <Button  onClick={handleSaveGroup} disabled={isGroupSaving}>
                  {isGroupSaving ? 'Saving...' : 'Create Group'}
                </Button>
              </div>
            </div>
          )}

          {/* Groups List */}
          <div className={styles.manageList}>
            {groups.length === 0 && !isAddingGroup ? (
              <div className={styles.manageEmptyState}>
                <FolderIcon />
                <p>No groups yet. Create one to organize your roles.</p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.id} className={styles.manageItem}>
                  {editingGroupId === group.id ? (
                    // Edit form
                    <div className={styles.manageItemForm}>
                      <div className={styles.manageItemFormFields}>
                        <Input
                          id={`edit-group-name-${group.id}`}
                          label="Group Name"
                          value={groupFormData.displayName}
                          onChange={(e) => setGroupFormData(prev => ({ ...prev, displayName: e.target.value }))}
                          error={groupError || undefined}
                          autoFocus
                        />
                        <Input
                          id={`edit-group-description-${group.id}`}
                          label="Description (optional)"
                          value={groupFormData.description}
                          onChange={(e) => setGroupFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                        <div className={styles.manageFormRow}>
                          <div className={styles.iconSelector}>
                            <span className={styles.iconSelectorLabel}>Icon</span>
                            <div className={styles.iconGrid}>
                              {VALID_ROLE_ICONS.map((icon) => {
                                const IconComponent = iconComponents[icon]
                                return (
                                  <button
                                    key={icon}
                                    type="button"
                                    className={`${styles.iconOption} ${groupFormData.icon === icon ? styles.iconOptionSelected : ''}`}
                                    onClick={() => setGroupFormData(prev => ({ ...prev, icon }))}
                                    style={groupFormData.icon === icon ? { color: groupFormData.color } : undefined}
                                  >
                                    <IconComponent />
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                          <div className={styles.colorSelector}>
                            <span className={styles.colorSelectorLabel}>Color</span>
                            <div className={styles.colorGrid}>
                              {COLORS.map((color) => (
                                <button
                                  key={color.value}
                                  type="button"
                                  className={`${styles.colorOption} ${groupFormData.color === color.value ? styles.colorOptionSelected : ''}`}
                                  onClick={() => setGroupFormData(prev => ({ ...prev, color: color.value }))}
                                  style={{ backgroundColor: color.value }}
                                  aria-label={color.label}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={styles.manageItemFormActions}>
                        <Button variant="ghost"  onClick={handleCancelGroupForm} disabled={isGroupSaving}>
                          Cancel
                        </Button>
                        <Button  onClick={handleSaveGroup} disabled={isGroupSaving}>
                          {isGroupSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  ) : deletingGroupId === group.id ? (
                    // Delete confirmation
                    <div className={styles.manageItemDelete}>
                      <p>Delete &quot;{group.displayName}&quot;?</p>
                      {(group.roleCount ?? 0) > 0 && (
                        <p className={styles.manageItemDeleteWarning}>
                          This group has {group.roleCount} role{(group.roleCount ?? 0) !== 1 ? 's' : ''} assigned.
                          They will become ungrouped.
                        </p>
                      )}
                      <div className={styles.manageItemDeleteActions}>
                        <Button variant="ghost"  onClick={() => setDeletingGroupId(null)}>
                          Cancel
                        </Button>
                        <Button className={styles.dangerButton}  onClick={() => handleDeleteGroup(group.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <>
                      <div className={styles.manageItemInfo}>
                        <span
                          className={styles.manageItemColor}
                          style={{ backgroundColor: group.color }}
                        />
                        <div className={styles.manageItemDetails}>
                          <span className={styles.manageItemName}>{group.displayName}</span>
                          <span className={styles.manageItemMeta}>
                            {group.roleCount ?? 0} role{(group.roleCount ?? 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className={styles.manageItemActions}>
                        <button
                          type="button"
                          className={styles.manageItemAction}
                          onClick={() => handleStartEditGroup(group)}
                          title="Edit group"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          className={`${styles.manageItemAction} ${styles.manageItemActionDanger}`}
                          onClick={() => setDeletingGroupId(group.id)}
                          title="Delete group"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tags Tab Content */}
      {activeTab === 'tags' && (
        <div className={styles.manageContent}>
          {/* Header with Add button */}
          <div className={styles.manageHeader}>
            <p className={styles.manageDescription}>
              Tags can be assigned to roles for categorization and filtering.
            </p>
            <div className={styles.manageHeaderActions}>
              {archivedCount > 0 && (
                <button
                  type="button"
                  className={styles.manageShowArchived}
                  onClick={() => setShowArchived(!showArchived)}
                >
                  {showArchived ? 'Hide archived' : `Show archived (${archivedCount})`}
                </button>
              )}
              {!isAddingTag && !editingTagId && (
                <Button variant="ghost"  onClick={handleStartAddTag}>
                  <PlusIcon />
                  Add Tag
                </Button>
              )}
            </div>
          </div>

          {/* Add Tag Form */}
          {isAddingTag && (
            <div className={styles.manageItemForm}>
              <div className={styles.manageItemFormFields}>
                <Input
                  id="new-tag-name"
                  label="Tag Name"
                  placeholder="e.g., Finance Team"
                  value={tagFormData.displayName}
                  onChange={(e) => setTagFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  error={tagError || undefined}
                  autoFocus
                />
                <Input
                  id="new-tag-description"
                  label="Description (optional)"
                  placeholder="Brief description"
                  value={tagFormData.description}
                  onChange={(e) => setTagFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className={styles.manageItemFormActions}>
                <Button variant="ghost"  onClick={handleCancelTagForm} disabled={isTagSaving}>
                  Cancel
                </Button>
                <Button  onClick={handleSaveTag} disabled={isTagSaving}>
                  {isTagSaving ? 'Saving...' : 'Create Tag'}
                </Button>
              </div>
            </div>
          )}

          {/* Tags List */}
          <div className={styles.manageList}>
            {filteredTags.length === 0 && !isAddingTag ? (
              <div className={styles.manageEmptyState}>
                <TagIcon />
                <p>{showArchived ? 'No archived tags.' : 'No tags yet. Create one to categorize your roles.'}</p>
              </div>
            ) : (
              filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className={`${styles.manageItem} ${tag.isArchived ? styles.manageItemArchived : ''}`}
                >
                  {editingTagId === tag.id ? (
                    // Edit form
                    <div className={styles.manageItemForm}>
                      <div className={styles.manageItemFormFields}>
                        <Input
                          id={`edit-tag-name-${tag.id}`}
                          label="Tag Name"
                          value={tagFormData.displayName}
                          onChange={(e) => setTagFormData(prev => ({ ...prev, displayName: e.target.value }))}
                          error={tagError || undefined}
                          autoFocus
                        />
                        <Input
                          id={`edit-tag-description-${tag.id}`}
                          label="Description (optional)"
                          value={tagFormData.description}
                          onChange={(e) => setTagFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className={styles.manageItemFormActions}>
                        <Button variant="ghost"  onClick={handleCancelTagForm} disabled={isTagSaving}>
                          Cancel
                        </Button>
                        <Button  onClick={handleSaveTag} disabled={isTagSaving}>
                          {isTagSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  ) : deletingTagId === tag.id ? (
                    // Delete confirmation
                    <div className={styles.manageItemDelete}>
                      <p>Permanently delete &quot;{tag.displayName}&quot;?</p>
                      <p className={styles.manageItemDeleteWarning}>
                        Consider archiving instead to preserve historical data.
                      </p>
                      <div className={styles.manageItemDeleteActions}>
                        <Button variant="ghost"  onClick={() => setDeletingTagId(null)}>
                          Cancel
                        </Button>
                        <Button className={styles.dangerButton}  onClick={() => handleDeleteTag(tag.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <>
                      <div className={styles.manageItemInfo}>
                        <div className={styles.manageItemDetails}>
                          <span className={styles.manageItemName}>
                            {tag.displayName}
                            {tag.isArchived && (
                              <span className={styles.manageItemArchivedBadge}>Archived</span>
                            )}
                          </span>
                          {tag.description && (
                            <span className={styles.manageItemDescription}>{tag.description}</span>
                          )}
                        </div>
                      </div>
                      <div className={styles.manageItemActions}>
                        <button
                          type="button"
                          className={styles.manageItemAction}
                          onClick={() => handleStartEditTag(tag)}
                          title="Edit tag"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          className={styles.manageItemAction}
                          onClick={() => handleArchiveTag(tag.id, tag.isArchived)}
                          title={tag.isArchived ? 'Restore tag' : 'Archive tag'}
                        >
                          {tag.isArchived ? <RestoreIcon /> : <ArchiveIcon />}
                        </button>
                        <button
                          type="button"
                          className={`${styles.manageItemAction} ${styles.manageItemActionDanger}`}
                          onClick={() => setDeletingTagId(tag.id)}
                          title="Delete tag"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

export default ManageTagsGroupsModal

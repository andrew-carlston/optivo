'use client'

import React, { useCallback } from 'react'
import { Toggle } from '@/components'
import type { TagPermissions, LabelPermissions } from '@/types/rbac'
import styles from '../page.module.sass'

interface TagLabelPermissionsProps {
  tagPermissions: TagPermissions
  labelPermissions: LabelPermissions
  onTagChange: (permissions: TagPermissions) => void
  onLabelChange: (permissions: LabelPermissions) => void
}

interface PermissionToggle {
  key: string
  label: string
  description: string
}

const TAG_TOGGLES: PermissionToggle[] = [
  { key: 'canCreateTags', label: 'Can Create', description: 'Create new tags' },
  { key: 'canEditTags', label: 'Can Edit', description: 'Edit existing tags' },
  { key: 'canDeleteTags', label: 'Can Delete', description: 'Delete tags' },
]

const LABEL_TOGGLES: PermissionToggle[] = [
  { key: 'canCreateLabels', label: 'Can Create', description: 'Create new labels' },
  { key: 'canEditLabels', label: 'Can Edit', description: 'Edit existing labels' },
  { key: 'canDeleteLabels', label: 'Can Delete', description: 'Delete labels' },
]

export default function TagLabelPermissions({
  tagPermissions,
  labelPermissions,
  onTagChange,
  onLabelChange
}: TagLabelPermissionsProps) {
  const handleTagToggle = useCallback((key: keyof TagPermissions, value: boolean) => {
    onTagChange({
      ...tagPermissions,
      [key]: value
    })
  }, [tagPermissions, onTagChange])

  const handleLabelToggle = useCallback((key: keyof LabelPermissions, value: boolean) => {
    onLabelChange({
      ...labelPermissions,
      [key]: value
    })
  }, [labelPermissions, onLabelChange])

  // View All is special - it's based on visibleTags/visibleLabels being null
  const canViewAllTags = tagPermissions.visibleTags === null
  const canViewAllLabels = labelPermissions.visibleLabels === null

  const handleViewAllTagsToggle = useCallback((checked: boolean) => {
    onTagChange({
      ...tagPermissions,
      visibleTags: checked ? null : []
    })
  }, [tagPermissions, onTagChange])

  const handleViewAllLabelsToggle = useCallback((checked: boolean) => {
    onLabelChange({
      ...labelPermissions,
      visibleLabels: checked ? null : []
    })
  }, [labelPermissions, onLabelChange])

  return (
    <div className={styles.tagLabelPermissions}>
      {/* Tags Section */}
      <section className={styles.tagLabelSection}>
        <h4 className={styles.tagLabelSectionTitle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          Tags
        </h4>

        <div className={styles.tagLabelToggles}>
          {TAG_TOGGLES.map((toggle) => (
            <div key={toggle.key} className={styles.tagLabelToggle}>
              <Toggle
                checked={tagPermissions[toggle.key as keyof TagPermissions] as boolean}
                onChange={(checked) => handleTagToggle(toggle.key as keyof TagPermissions, checked)}
                label={toggle.label}
                size="sm"
              />
              <span className={styles.tagLabelToggleHint}>{toggle.description}</span>
            </div>
          ))}

          {/* View All Tags */}
          <div className={styles.tagLabelToggle}>
            <Toggle
              checked={canViewAllTags}
              onChange={handleViewAllTagsToggle}
              label="Can View All"
              size="sm"
            />
            <span className={styles.tagLabelToggleHint}>View all tags in the system</span>
          </div>
        </div>
      </section>

      {/* Labels Section */}
      <section className={styles.tagLabelSection}>
        <h4 className={styles.tagLabelSectionTitle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
          Labels
        </h4>

        <div className={styles.tagLabelToggles}>
          {LABEL_TOGGLES.map((toggle) => (
            <div key={toggle.key} className={styles.tagLabelToggle}>
              <Toggle
                checked={labelPermissions[toggle.key as keyof LabelPermissions] as boolean}
                onChange={(checked) => handleLabelToggle(toggle.key as keyof LabelPermissions, checked)}
                label={toggle.label}
                size="sm"
              />
              <span className={styles.tagLabelToggleHint}>{toggle.description}</span>
            </div>
          ))}

          {/* View All Labels */}
          <div className={styles.tagLabelToggle}>
            <Toggle
              checked={canViewAllLabels}
              onChange={handleViewAllLabelsToggle}
              label="Can View All"
              size="sm"
            />
            <span className={styles.tagLabelToggleHint}>View all labels in the system</span>
          </div>
        </div>
      </section>
    </div>
  )
}

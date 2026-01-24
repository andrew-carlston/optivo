'use client'

import React from 'react'
import { Role, RoleGroup } from '@/types/rbac'
import { Button } from '@/components'
import RoleCard from './RoleCard'
import styles from '../page.module.sass'

interface RoleCardGridProps {
  roles: Role[]
  groups?: RoleGroup[]
  onRoleClick: (role: Role) => void
  onCreateRole: () => void
  onManageTagsGroups?: () => void
  isLoading: boolean
}

// Plus icon for create button
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

// Empty state icon
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

// Skeleton card for loading state
const SkeletonCard: React.FC = () => (
  <div className={styles.skeletonCard} aria-hidden="true">
    <div className={styles.skeletonCardHeader}>
      <div className={styles.skeletonIcon} />
      <div className={styles.skeletonCardInfo}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonDescription} />
      </div>
    </div>
    <div className={styles.skeletonMeta} />
  </div>
)

// Settings/gear icon for manage
const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const RoleCardGrid: React.FC<RoleCardGridProps> = ({
  roles,
  groups = [],
  onRoleClick,
  onCreateRole,
  onManageTagsGroups,
  isLoading
}) => {
  // Render loading skeleton
  if (isLoading) {
    return (
      <>
        <div className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>Roles & Permissions</h1>
            <p className={styles.headerDescription}>
              Manage user roles and their access permissions
            </p>
          </div>
          <div className={styles.headerActions}>
            {onManageTagsGroups && (
              <Button
                variant="ghost"
                onClick={onManageTagsGroups}
                disabled
              >
                <SettingsIcon />
                Manage Tags & Groups
              </Button>
            )}
            <Button
              onClick={onCreateRole}
              disabled
            >
              <PlusIcon />
              New Role
            </Button>
          </div>
        </div>
        <div className={styles.roleGrid} role="list" aria-busy="true" aria-label="Loading roles">
          <SkeletonCard />
        </div>
      </>
    )
  }

  // Render empty state
  if (roles.length === 0) {
    return (
      <>
        <div className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>Roles & Permissions</h1>
            <p className={styles.headerDescription}>
              Manage user roles and their access permissions
            </p>
          </div>
          <div className={styles.headerActions}>
            {onManageTagsGroups && (
              <Button
                variant="ghost"
                onClick={onManageTagsGroups}
              >
                <SettingsIcon />
                Manage Tags & Groups
              </Button>
            )}
            <Button onClick={onCreateRole}>
              <PlusIcon />
              New Role
            </Button>
          </div>
        </div>
        <div className={styles.roleGrid}>
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <ShieldIcon />
            </div>
            <h2 className={styles.emptyStateTitle}>No roles yet</h2>
            <p className={styles.emptyStateDescription}>
              Create your first role to start managing user permissions in your organization.
            </p>
            <Button onClick={onCreateRole}>
              <PlusIcon />
              Create First Role
            </Button>
          </div>
        </div>
      </>
    )
  }

  // Sort roles by priority (higher priority first)
  const sortedRoles = [...roles].sort((a, b) => b.priority - a.priority)

  // Helper to get parent role name
  const getParentRoleName = (parentRoleId: string | null): string | null => {
    if (!parentRoleId) return null
    const parent = roles.find(r => r.id === parentRoleId)
    return parent?.displayName ?? null
  }

  // Group roles by their groupId
  const ungroupedRoles = sortedRoles.filter(r => !r.groupId)
  const groupedRolesByGroup = groups.reduce((acc, group) => {
    acc[group.id] = sortedRoles.filter(r => r.groupId === group.id)
    return acc
  }, {} as Record<string, Role[]>)

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Roles & Permissions</h1>
          <p className={styles.headerDescription}>
            Manage user roles and their access permissions
          </p>
        </div>
        <div className={styles.headerActions}>
          {onManageTagsGroups && (
            <Button
              variant="ghost"
              onClick={onManageTagsGroups}
            >
              <SettingsIcon />
              Manage Tags & Groups
            </Button>
          )}
          <Button onClick={onCreateRole}>
            <PlusIcon />
            New Role
          </Button>
        </div>
      </div>

      {/* Groups and roles in a flexible grid */}
      <div className={styles.groupsContainer}>
        {/* Grouped roles - each group as a column */}
        {groups.map((group) => {
          const groupRoles = groupedRolesByGroup[group.id] || []
          return (
            <div key={group.id} className={styles.groupColumn}>
              <div className={styles.groupColumnHeader}>
                <span
                  className={styles.roleGroupColor}
                  style={{ backgroundColor: group.color }}
                />
                <h3 className={styles.roleGroupTitle}>{group.displayName}</h3>
                <span className={styles.roleGroupCount}>
                  {groupRoles.length} role{groupRoles.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className={styles.groupColumnRoles} role="list" aria-label={`${group.displayName} roles`}>
                {groupRoles.length > 0 ? (
                  groupRoles.map((role) => (
                    <RoleCard
                      key={role.id}
                      role={role}
                      tags={role.tags}
                      parentRoleName={getParentRoleName(role.parentRoleId)}
                      onClick={() => onRoleClick(role)}
                    />
                  ))
                ) : (
                  <p className={styles.emptyGroupText}>No roles in this group</p>
                )}
              </div>
            </div>
          )
        })}

        {/* Ungrouped/Independent roles as a column */}
        {ungroupedRoles.length > 0 && (
          <div className={styles.groupColumn}>
            <div className={styles.groupColumnHeader}>
              <h3 className={styles.roleGroupTitle}>Independent</h3>
              <span className={styles.roleGroupCount}>
                {ungroupedRoles.length} role{ungroupedRoles.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className={styles.groupColumnRoles} role="list" aria-label="Independent roles">
              {ungroupedRoles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  tags={role.tags}
                  parentRoleName={getParentRoleName(role.parentRoleId)}
                  onClick={() => onRoleClick(role)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default RoleCardGrid

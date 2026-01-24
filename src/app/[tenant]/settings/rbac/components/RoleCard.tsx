'use client'

import React, { useState } from 'react'
import { Role, RoleIcon } from '@/types/rbac'
import { Badge } from '@/components'
import { useAppearanceSafe } from '@/context'
import styles from '../page.module.sass'

interface RoleCardProps {
  role: Role
  memberCount?: number
  tags?: string[]
  parentRoleName?: string | null
  onClick: () => void
}

// Arrow icon for parent relationship
const ArrowUpIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
)

// Icon components for each role type
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

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const TagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)

const iconMap: Record<RoleIcon, React.FC> = {
  crown: CrownIcon,
  shield: ShieldIcon,
  briefcase: BriefcaseIcon,
  user: UserIcon,
  eye: EyeIcon,
  lock: LockIcon,
  star: StarIcon
}

const RoleCard: React.FC<RoleCardProps> = ({ role, memberCount, tags = [], parentRoleName, onClick }) => {
  const [tagsExpanded, setTagsExpanded] = useState(false) // Collapsed by default
  const IconComponent = iconMap[role.icon] || UserIcon
  const displayMemberCount = memberCount ?? role.memberCount ?? 0
  const appearance = useAppearanceSafe()

  // Get badge config from appearance settings (use 'status' type for role badges)
  const badgeConfig = appearance?.getBadgeConfig('status')

  // Build special badges list (System, Default)
  const specialBadges: { label: string; color: 'primary' | 'info' }[] = []
  if (role.isSystemRole) {
    specialBadges.push({ label: 'System', color: 'primary' })
  }
  if (role.isDefault) {
    specialBadges.push({ label: 'Default', color: 'info' })
  }

  // Total count includes special badges + regular tags
  const totalTagCount = specialBadges.length + tags.length

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  const handleTagsToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    setTagsExpanded(!tagsExpanded)
  }

  const handleTagsToggleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent card's keydown handler from firing when pressing Enter/Space on button
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation()
    }
  }

  return (
    <div
      className={styles.roleCard}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${role.displayName} role${role.isDefault ? ' (Default)' : ''}${role.isSystemRole ? ' - System Role' : ''}`}
      style={{ '--role-color': role.color } as React.CSSProperties}
    >
      {/* Headcount in top right */}
      <div className={styles.roleCardHeadcount}>
        <UsersIcon />
        <span>{displayMemberCount}</span>
      </div>

      {/* Main content */}
      <div className={styles.roleCardContent}>
        <div className={styles.roleCardIcon}>
          <IconComponent />
        </div>
        <div className={styles.roleCardInfo}>
          <h3 className={styles.roleCardTitle}>{role.displayName}</h3>
          {role.description && (
            <p className={styles.roleCardDescription}>{role.description}</p>
          )}
          {parentRoleName && (
            <p className={styles.roleCardParent}>
              <ArrowUpIcon />
              <span>Reports to {parentRoleName}</span>
            </p>
          )}
        </div>
      </div>

      {/* Collapsible tags section (includes System/Default badges and regular tags) */}
      <div className={styles.roleCardTagsSection}>
        <button
          type="button"
          className={styles.roleCardTagsToggle}
          onClick={handleTagsToggle}
          onKeyDown={handleTagsToggleKeyDown}
          aria-expanded={tagsExpanded}
        >
          <TagIcon />
          <span>Tags</span>
          <span className={styles.roleCardTagCount}>{totalTagCount}</span>
          <ChevronIcon expanded={tagsExpanded} />
        </button>
        {tagsExpanded && totalTagCount > 0 && (
          <div className={styles.roleCardTagsList}>
            {/* Special badges (System, Default) at the top */}
            {specialBadges.map((badge) => (
              <Badge
                key={badge.label}
                variant={badgeConfig?.shape}
                fill={badgeConfig?.fill}
                color={badge.color}
                leafSide={badgeConfig?.leafSide}
                cornerPosition={badgeConfig?.cornerPosition}
                className={styles.roleCardSpecialBadge}
              >
                {badge.label}
              </Badge>
            ))}
            {/* Regular tags */}
            {tags.map((tag) => (
              <span key={tag} className={styles.roleCardTag}>{tag}</span>
            ))}
          </div>
        )}
        {tagsExpanded && totalTagCount === 0 && (
          <p className={styles.roleCardNoTags}>No tags assigned</p>
        )}
      </div>
    </div>
  )
}

export default RoleCard

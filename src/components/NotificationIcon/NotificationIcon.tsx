'use client'

import React from 'react'
import Menu, { MenuItem, MenuLabel, MenuDivider } from '@/components/Menu/Menu'
import styles from './NotificationIcon.module.sass'

export interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
}

interface NotificationIconProps {
  count?: number
  notifications?: Notification[]
  onNotificationClick?: (notification: Notification) => void
  onViewAll?: () => void
  onMarkAllRead?: () => void
  className?: string
}

const BellIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const NotificationIcon: React.FC<NotificationIconProps> = ({
  count = 0,
  notifications = [],
  onNotificationClick,
  onViewAll,
  onMarkAllRead,
  className,
}) => {
  const hasNotifications = count > 0
  const displayCount = count > 99 ? '99+' : count

  const triggerButton = (
    <button
      className={`${styles.notificationButton} ${className || ''}`.trim()}
      aria-label={`Notifications${hasNotifications ? `, ${count} unread` : ''}`}
    >
      <span className={styles.iconWrapper}>
        <BellIcon />
        {hasNotifications && (
          <span className={styles.badge} aria-hidden="true">
            {displayCount}
          </span>
        )}
      </span>
    </button>
  )

  return (
    <Menu trigger={triggerButton} align="right">
      <MenuLabel>Notifications</MenuLabel>

      {notifications.length === 0 ? (
        <div className={styles.emptyState}>
          No notifications
        </div>
      ) : (
        <>
          {notifications.slice(0, 5).map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => onNotificationClick?.(notification)}
            >
              <div className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}>
                <span className={styles.notificationTitle}>{notification.title}</span>
                <span className={styles.notificationTime}>{notification.time}</span>
              </div>
            </MenuItem>
          ))}

          <MenuDivider />

          {onMarkAllRead && (
            <MenuItem onClick={onMarkAllRead}>
              <span className={styles.actionText}>Mark all as read</span>
            </MenuItem>
          )}

          {onViewAll && (
            <MenuItem onClick={onViewAll}>
              <span className={styles.actionText}>View all notifications</span>
            </MenuItem>
          )}
        </>
      )}
    </Menu>
  )
}

export default NotificationIcon

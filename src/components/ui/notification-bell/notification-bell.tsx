"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell } from "lucide-react";
import { cn } from "@/lib/cn";
import "./notification-bell.scss";

interface Notification {
  id: string;
  title: string;
  body?: string;
  time: string;
  read: boolean;
}

interface NotificationBellProps {
  notifications?: Notification[];
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
}

export function NotificationBell({
  notifications = [],
  onMarkRead,
  onMarkAllRead,
}: NotificationBellProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="notification-bell" title="Notifications">
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="notification-bell__badge">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="notification-menu" sideOffset={6} align="end">
          <div className="notification-menu__header">
            <span className="notification-menu__title">Notifications</span>
            {unreadCount > 0 && onMarkAllRead && (
              <button className="notification-menu__mark-all" onClick={onMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>
          <DropdownMenu.Separator className="notification-menu__separator" />
          {notifications.length === 0 ? (
            <div className="notification-menu__empty">No notifications</div>
          ) : (
            <div className="notification-menu__list">
              {notifications.map((n) => (
                <DropdownMenu.Item
                  key={n.id}
                  className={cn(
                    "notification-menu__item",
                    !n.read && "notification-menu__item--unread"
                  )}
                  onSelect={() => onMarkRead?.(n.id)}
                >
                  <div className="notification-menu__item-content">
                    <span className="notification-menu__item-title">{n.title}</span>
                    {n.body && <span className="notification-menu__item-body">{n.body}</span>}
                  </div>
                  <span className="notification-menu__item-time">{n.time}</span>
                </DropdownMenu.Item>
              ))}
            </div>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

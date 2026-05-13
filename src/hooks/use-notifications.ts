"use client";

import { useNotificationStore } from "@/stores/notification-store";

export function useNotifications() {
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  };
}

export function useUnreadCount() {
  return useNotificationStore((s) => s.unreadCount);
}

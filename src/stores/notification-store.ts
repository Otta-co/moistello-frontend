"use client";

import { create } from "zustand";
import type { Notification, ApiResponse } from "@/types";
import { get as apiGet, patch as apiPatch } from "@/lib/api-client";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
}

interface NotificationActions {
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

type NotificationStore = NotificationState & NotificationActions;

function computeUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.isRead).length;
}

export const useNotificationStore = create<NotificationStore>()(
  (set) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    fetchNotifications: async () => {
      set({ isLoading: true });
      try {
        const response = await apiGet<ApiResponse<Notification[]>>(
          "/notifications"
        );
        const notifications = response.data ?? [];
        set({
          notifications,
          unreadCount: computeUnreadCount(notifications),
          isLoading: false,
        });
      } catch {
        set({ isLoading: false });
      }
    },

    markAsRead: async (id: string) => {
      try {
        await apiPatch(`/notifications/${id}/read`);
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          );
          return {
            notifications,
            unreadCount: computeUnreadCount(notifications),
          };
        });
      } catch {
        // Silently fail; UI should remain consistent
      }
    },

    markAllAsRead: async () => {
      try {
        await apiPatch("/notifications/read-all");
        set((state) => {
          const notifications = state.notifications.map((n) => ({
            ...n,
            isRead: true,
          }));
          return {
            notifications,
            unreadCount: 0,
          };
        });
      } catch {
        // Silently fail
      }
    },

    addNotification: (notification: Notification) => {
      set((state) => {
        const notifications = [notification, ...state.notifications];
        return {
          notifications,
          unreadCount: computeUnreadCount(notifications),
        };
      });
    },
  })
);

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";
type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  activeModal: string | null;
  toasts: Toast[];
}

interface UIActions {
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      theme: "dark",
      sidebarOpen: false,
      activeModal: null,
      toasts: [],

      toggleTheme: () => {
        const { theme } = get();
        const next =
          theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
        set({ theme: next });
      },

      setTheme: (theme: Theme) => set({ theme }),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

      openModal: (id: string) => set({ activeModal: id }),

      closeModal: () => set({ activeModal: null }),

      addToast: (toast: Omit<Toast, "id">) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const newToast: Toast = { ...toast, id };
        set((state) => ({ toasts: [...state.toasts, newToast] }));

        const duration = toast.duration ?? 5000;
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
      },

      removeToast: (id: string) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: "moistello_theme",
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

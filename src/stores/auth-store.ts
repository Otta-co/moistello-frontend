"use client";

import { create } from "zustand";
import { ApiResponse, User } from "@/types";
import { post } from "@/lib/api-client";

const ACCESS_TOKEN_KEY = "moistello_access_token";
const REFRESH_TOKEN_KEY = "moistello_refresh_token";

function getStoredToken(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStoredToken(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage unavailable
  }
}

function removeStoredToken(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // localStorage unavailable
  }
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
}

interface AuthActions {
  login: (walletAddress: string, signature: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()((set, get) => ({
  isAuthenticated: false,
  user: null,
  token: getStoredToken(ACCESS_TOKEN_KEY),
  refreshToken: getStoredToken(REFRESH_TOKEN_KEY),
  isLoading: false,

  login: async (walletAddress: string, signature: string) => {
    set({ isLoading: true });
    try {
      const response = await post<ApiResponse<LoginResponse>>("/auth/verify", {
        walletAddress,
        signature,
      });

      const data = response.data ?? (response as unknown as LoginResponse);

      if (!data.token || !data.user) {
        throw new Error(response.error || "Authentication failed");
      }

      const { token, refreshToken, user } = data;

      setStoredToken(ACCESS_TOKEN_KEY, token);
      setStoredToken(REFRESH_TOKEN_KEY, refreshToken);

      set({
        isAuthenticated: true,
        user,
        token,
        refreshToken,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    const { clearTokens } = get();
    clearTokens();
    set({
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
    });
  },

  checkAuth: async () => {
    const token = getStoredToken(ACCESS_TOKEN_KEY);
    if (!token) {
      set({ isAuthenticated: false, user: null, token: null, refreshToken: null, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await post<ApiResponse<{ user: User }>>("/auth/me");

      const data = response.data;

      if (!data?.user) {
        throw new Error("Invalid session");
      }

      const refreshToken = getStoredToken(REFRESH_TOKEN_KEY);

      set({
        isAuthenticated: true,
        user: data.user,
        token,
        refreshToken,
        isLoading: false,
      });
    } catch {
      get().logout();
    }
  },

  setTokens: (accessToken: string, refreshToken: string) => {
    setStoredToken(ACCESS_TOKEN_KEY, accessToken);
    setStoredToken(REFRESH_TOKEN_KEY, refreshToken);
    set({ token: accessToken, refreshToken });
  },

  clearTokens: () => {
    removeStoredToken(ACCESS_TOKEN_KEY);
    removeStoredToken(REFRESH_TOKEN_KEY);
    set({ token: null, refreshToken: null });
  },
}));

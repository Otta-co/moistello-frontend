"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const isLoading = useAuthStore((s) => s.isLoading);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const hasChecked = useAuthStore((s) => s.token !== null || s.isLoading);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading && !hasChecked) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}

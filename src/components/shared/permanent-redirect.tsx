"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PermanentRedirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => { router.replace(to); }, [router, to]);
  return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-2 border-aurora-violet border-t-transparent rounded-full" />
    </div>
  );
}

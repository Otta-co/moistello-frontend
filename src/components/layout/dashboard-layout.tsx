"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileMenu } from "@/components/layout/mobile-menu";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className="relative min-h-screen bg-[rgb(var(--background))] overflow-hidden">
      {/* Auroral mesh background */}
      <div className="fixed inset-0 auroral-mesh pointer-events-none z-0" />

      {/* Content layer */}
      <div className="relative z-10">
        {/* Desktop sidebar (always visible on lg+) */}
        <Sidebar />

        {/* Header with hamburger for mobile menu */}
        <Header
          onToggleMobileMenu={toggleMobileMenu}
          isMobileMenuOpen={mobileMenuOpen}
        />

        {/* Mobile menu (slides from RIGHT, lg:hidden) */}
        <MobileMenu isOpen={mobileMenuOpen} onClose={closeMobileMenu} />

        <main
          className={cn(
            "pt-24 pb-24 px-0 lg:pl-72 lg:pr-0 min-h-screen",
          )}
        >
          <div className="container-premium py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
}

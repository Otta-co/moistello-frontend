"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CircleDot,
  Compass,
  ArrowUpCircle,
  ArrowDownCircle,
  Award,
  Bell,
  Settings,
  Wallet,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Routes } from "@/lib/constants";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore } from "@/stores/notification-store";
import { Avatar } from "@/components/ui/avatar";
import { formatAddress } from "@/lib/formatters";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const staggerItems = {
  hidden: { opacity: 0, x: 24 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.03 + i * 0.025,
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useUIStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  const isDark = theme === "dark";

  const isActive = (href: string) => {
    if (href === Routes.DASHBOARD) return pathname === Routes.DASHBOARD;
    return pathname.startsWith(href);
  };

  const navGroups: NavGroup[] = [
    {
      title: "Platform",
      items: [
        { label: "Dashboard", href: Routes.DASHBOARD, icon: <LayoutDashboard className="h-[18px] w-[18px]" /> },
        { label: "Circles", href: Routes.CIRCLES, icon: <CircleDot className="h-[18px] w-[18px]" /> },
        { label: "Discover", href: "/discover", icon: <Compass className="h-[18px] w-[18px]" /> },
      ],
    },
    {
      title: "Activity",
      items: [
        { label: "Contributions", href: "/contributions", icon: <ArrowUpCircle className="h-[18px] w-[18px]" /> },
        { label: "Payouts", href: "/payouts", icon: <ArrowDownCircle className="h-[18px] w-[18px]" /> },
        { label: "Reputation", href: Routes.PROFILE_SCORE, icon: <Award className="h-[18px] w-[18px]" /> },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Notifications", href: Routes.NOTIFICATIONS, icon: <Bell className="h-[18px] w-[18px]" />, badge: unreadCount },
        { label: "Settings", href: Routes.PROFILE_SETTINGS, icon: <Settings className="h-[18px] w-[18px]" /> },
        { label: "Wallet", href: Routes.WALLET, icon: <Wallet className="h-[18px] w-[18px]" /> },
      ],
    },
  ];

  const userFallback = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : "U";

  const handleLogout = () => {
    logout();
    onClose();
  };

  let itemIndex = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Blur backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-lg"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-out panel from RIGHT */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 right-0 bottom-0 z-50 w-[85vw] max-w-[360px] will-change-transform"
          >
            <div
              className={cn(
                "flex flex-col h-full rounded-l-2xl overflow-hidden",
                "glass-flagship backdrop-blur-xl",
                "border-l border-white/[0.08] dark:border-white/[0.06]",
                "shadow-[_-12px_0_60px_rgba(0,0,0,0.3)]",
                "relative",
              )}
            >
              {/* Holographic accent at top */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-aurora-violet/40 to-transparent" />

              {/* Header row */}
              <div className="flex h-16 items-center justify-between px-5 pt-2 shrink-0">
                <Link
                  href="/"
                  onClick={onClose}
                  className="flex items-center gap-2 select-none"
                >
                  <motion.span
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="gradient-text-extended font-heading font-bold text-xl tracking-tight"
                  >
                    Moistello
                  </motion.span>
                </Link>
                <button
                  onClick={onClose}
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-xl",
                    "text-muted-foreground transition-all duration-300",
                    "hover:text-foreground hover:glass-whisper",
                  )}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User card (if authenticated) */}
              {isAuthenticated && user && (
                <div className="shrink-0 px-3 pt-1 pb-3">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl",
                      "glass-strong border border-white/[0.06]",
                    )}
                  >
                    <Avatar fallback={userFallback} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-body font-medium text-foreground truncate">
                        {user.displayName ?? "User"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        {user.walletAddress ? formatAddress(user.walletAddress, 6, 4) : ""}
                      </p>
                    </div>
                    <div className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgb(52_211_153/0.5)]" />
                  </motion.div>
                </div>
              )}

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto px-2 py-1 scrollbar-none">
                {navGroups.map((group) => (
                  <div key={group.title} className="mb-4">
                    <h3
                      className={cn(
                        "px-3 pt-4 pb-2 font-heading text-[10px] tracking-[0.25em] uppercase",
                        "text-muted-foreground/60",
                      )}
                    >
                      {group.title}
                    </h3>
                    <ul className="space-y-0.5">
                      {group.items.map((item) => {
                        const idx = itemIndex++;
                        const active = isActive(item.href);
                        return (
                          <motion.li
                            key={item.href}
                            custom={idx}
                            initial="hidden"
                            animate="visible"
                            variants={staggerItems}
                          >
                            <Link
                              href={item.href}
                              onClick={onClose}
                              className={cn(
                                "relative flex items-center gap-3 rounded-xl mx-2 px-3 py-2.5",
                                "text-sm font-body transition-all duration-300",
                                active
                                  ? "glass-strong bg-gradient-to-r from-aurora-violet/10 to-transparent text-foreground"
                                  : "text-muted-foreground hover:text-foreground hover:glass-whisper",
                              )}
                            >
                              {active && (
                                <span className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-gradient-to-b from-aurora-indigo via-aurora-violet to-aurora-cyan" />
                              )}
                              <span
                                className={cn(
                                  "shrink-0 transition-colors duration-300",
                                  active ? "text-aurora-violet" : "text-muted-foreground",
                                )}
                              >
                                {item.icon}
                              </span>
                              <span className="flex-1">{item.label}</span>
                              {item.badge !== undefined && item.badge > 0 && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className={cn(
                                    "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full",
                                    "bg-destructive text-[10px] font-bold text-white px-1.5 leading-none",
                                  )}
                                >
                                  {item.badge > 99 ? "99+" : item.badge}
                                </motion.span>
                              )}
                            </Link>
                          </motion.li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>

              {/* Bottom actions */}
              <div className="shrink-0 border-t border-white/[0.06] px-5 py-4 space-y-3">
                {/* Theme toggle */}
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleTheme}
                  className={cn(
                    "flex items-center gap-3 w-full rounded-xl px-4 py-2.5",
                    "text-sm font-body transition-all duration-300",
                    "glass-whisper hover:glass-strong",
                    "hover:shadow-[0_0_20px_rgb(var(--aurora-violet)/0.15)]",
                  )}
                  aria-label="Toggle theme"
                >
                  <motion.span
                    initial={{ rotate: 0 }}
                    animate={{ rotate: isDark ? 0 : 180 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      "glass-strong",
                    )}
                  >
                    {isDark ? (
                      <Sun className="h-4 w-4 text-amber-400" />
                    ) : (
                      <Moon className="h-4 w-4 text-indigo-400" />
                    )}
                  </motion.span>
                  <span className="flex-1 text-left text-foreground">
                    {isDark ? "Light Mode" : "Dark Mode"}
                  </span>
                </motion.button>

                {/* Logout */}
                {isAuthenticated && (
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.38, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className={cn(
                      "flex items-center gap-3 w-full rounded-xl px-4 py-2.5",
                      "text-sm font-body transition-all duration-300",
                      "text-red-400 glass-whisper hover:glass-strong",
                      "hover:bg-red-500/10 hover:shadow-[0_0_20px_rgb(239_68_68/0.15)]",
                    )}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full glass-strong text-red-400">
                      <X className="h-4 w-4" />
                    </span>
                    <span>Logout</span>
                  </motion.button>
                )}
              </div>

              {/* Copyright */}
              <div className="shrink-0 border-t border-white/[0.04] px-5 py-3">
                <p className="text-[10px] text-muted-foreground/40 font-body tracking-wider">
                  &copy; {new Date().getFullYear()} Moistello
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Routes } from "@/lib/constants";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore } from "@/stores/notification-store";

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

const staggerItems = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.04 + i * 0.03,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useUIStore();
  const { user, isAuthenticated } = useAuthStore();
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

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="hidden lg:block fixed left-3 top-20 bottom-3 w-64 z-30"
    >
      <motion.aside
        className={cn(
          "flex flex-col h-full rounded-3xl overflow-hidden",
          "glass-strong backdrop-blur-2xl",
          "border border-white/[0.06] dark:border-white/[0.08]",
          "relative",
        )}
      >
        {/* Holographic accent line at top */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-aurora-violet/40 to-transparent" />

        {/* Logo + Theme toggle */}
        <div className="flex h-16 items-center justify-between px-5 pt-2">
          <Link href="/" className="flex items-center gap-2 select-none">
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="gradient-text font-heading font-bold text-xl tracking-tight"
            >
              Moistello
            </motion.span>
          </Link>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-xl",
              "glass-whisper text-muted-foreground",
              "transition-all duration-300 hover:text-foreground",
            )}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-indigo-400" />
            )}
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 scrollbar-none">
          {navGroups.map((group, gi) => (
            <div key={group.title} className="mb-5">
              <h3
                className={cn(
                  "px-3 pt-6 pb-2 font-heading text-[10px] tracking-[0.25em] uppercase",
                  "text-muted-foreground/70",
                )}
              >
                {group.title}
              </h3>
              <ul className="space-y-0.5">
                {group.items.map((item, i) => {
                  const active = isActive(item.href);
                  return (
                    <motion.li
                      key={item.href}
                      custom={gi * 3 + i}
                      initial="hidden"
                      animate="visible"
                      variants={staggerItems}
                    >
                      <Link
                        href={item.href}
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

        {/* User card */}
        {isAuthenticated && user && (
          <div className="shrink-0 p-2">
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-2xl",
                "glass-whisper border border-white/[0.05]",
                "transition-all duration-300 hover:glass-strong",
              )}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-bg text-white font-mono text-xs font-bold">
                {userFallback}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-body font-medium text-foreground truncate">
                  {user.displayName ?? "User"}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">
                  Moi Score: {user.moiScore}
                </p>
              </div>
              <div className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgb(52_211_153/0.5)]" />
            </div>
          </div>
        )}

        {/* Copyright */}
        <div className="shrink-0 border-t border-white/[0.04] px-5 py-3">
          <p className="text-[10px] text-muted-foreground/50 font-body tracking-wider">
            &copy; {new Date().getFullYear()} Moistello
          </p>
        </div>
      </motion.aside>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Menu,
  X,
  Wallet,
  Bell,
  Settings,
  LogOut,
  Sun,
  Moon,
  Home,
  CircleDot,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatAddress } from "@/lib/formatters";
import { Routes } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useWalletStore } from "@/stores/wallet-store";
import { useNotificationStore } from "@/stores/notification-store";

const navLinks: { label: string; href: string; icon: React.ReactNode }[] = [
  { label: "Dashboard", href: Routes.DASHBOARD, icon: <Home className="h-4 w-4" /> },
  { label: "Circles", href: Routes.CIRCLES, icon: <CircleDot className="h-4 w-4" /> },
  { label: "Discover", href: "/discover", icon: <Compass className="h-4 w-4" /> },
];

interface HeaderProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

export function Header({ onToggleMobileMenu, isMobileMenuOpen }: HeaderProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useUIStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isConnected, address, connect } = useWalletStore();
  const { unreadCount } = useNotificationStore();
  const [showConnectModal, setShowConnectModal] = useState(false);

  const isDark = theme === "dark";

  const userFallback = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.walletAddress
      ? user.walletAddress.slice(0, 2).toUpperCase()
      : "U";

  const handleLogout = () => logout();

  const isActive = (href: string) => {
    if (href === Routes.DASHBOARD) return pathname === Routes.DASHBOARD;
    return pathname.startsWith(href);
  };

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "sticky top-3 mx-3 z-50 h-14",
          "rounded-2xl",
          "glass-strong backdrop-blur-2xl",
          "border border-white/[0.06] dark:border-white/[0.08]",
          "depth-3",
          "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-aurora-indigo/5 before:via-aurora-violet/5 before:to-aurora-cyan/5 before:pointer-events-none",
        )}
      >
        <div className="relative flex h-full items-center justify-between px-4 lg:px-6">
          {/* Left: Mobile hamburger + Logo */}
          <div className="flex items-center gap-3">
            <motion.button
              onClick={onToggleMobileMenu}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-xl",
                "text-muted-foreground transition-all duration-300",
                "hover:text-foreground hover:glass-whisper",
                "lg:hidden",
              )}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.span
                    key="x"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <Link href="/" className="flex items-center gap-2 select-none">
              <motion.span
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="gradient-text-extended font-heading font-bold text-lg tracking-tight"
              >
                Moistello
              </motion.span>
            </Link>
          </div>

          {/* Center: Desktop nav */}
          <LayoutGroup>
            <nav className="hidden lg:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link, i) => {
                const active = isActive(link.href);
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        "relative flex items-center gap-2 px-4 py-2 text-sm font-body rounded-xl",
                        "transition-colors duration-300",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:glass-whisper",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="headerActiveNav"
                          className="absolute inset-0 rounded-xl glass-strong bg-gradient-to-r from-aurora-violet/10 to-transparent"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        {link.icon}
                        <span className="font-heading text-[11px] tracking-[0.15em] uppercase">
                          {link.label}
                        </span>
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </LayoutGroup>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5">
            {/* Theme toggle */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9, rotate: -15 }}
              onClick={toggleTheme}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full",
                "glass-whisper text-muted-foreground",
                "transition-all duration-300 hover:text-foreground",
                "hover:shadow-[0_0_18px_rgb(var(--aurora-violet)/0.2)]",
              )}
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                {isDark ? (
                  <motion.span
                    key="sun"
                    initial={{ rotate: -90, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    exit={{ rotate: 90, scale: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Sun className="h-4 w-4 text-amber-400" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="moon"
                    initial={{ rotate: 90, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    exit={{ rotate: -90, scale: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Moon className="h-4 w-4 text-indigo-400" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Wallet */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {isConnected && address ? (
                <div
                  className={cn(
                    "relative flex items-center gap-2 glass-whisper px-3 py-1.5 rounded-full cursor-pointer",
                    "transition-all duration-300 hover:glass-strong hover:-translate-y-[1px]",
                    "hover:shadow-[0_0_20px_rgb(var(--aurora-violet)/0.15)]",
                  )}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_6px_rgb(52_211_153/0.6)]" />
                  </span>
                  <span className="font-mono text-xs text-foreground tracking-tight">
                    {formatAddress(address, 4, 4)}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => setShowConnectModal(true)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-body",
                    "glass-whisper text-muted-foreground",
                    "transition-all duration-300 hover:text-foreground hover:-translate-y-[1px]",
                    "hover:shadow-[0_0_18px_rgb(var(--aurora-violet)/0.18)]",
                    "hidden sm:inline-flex",
                  )}
                >
                  <Wallet className="h-3.5 w-3.5" />
                  <span>Connect</span>
                </button>
              )}
            </motion.div>

            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={Routes.NOTIFICATIONS} className="relative inline-flex">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "relative inline-flex h-9 w-9 items-center justify-center rounded-full",
                    "glass-whisper text-muted-foreground",
                    "transition-all duration-300 hover:text-foreground",
                    "hover:shadow-[0_0_18px_rgb(var(--aurora-violet)/0.2)]",
                  )}
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className={cn(
                          "absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full",
                          "bg-destructive text-[9px] font-bold flex items-center justify-center",
                          "text-white ring-2 ring-[rgb(var(--background))]",
                        )}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            </motion.div>

            {/* User avatar + dropdown */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {isAuthenticated ? (
                <Dropdown
                  align="right"
                  trigger={
                    <motion.div
                      whileHover={{ scale: 1.08, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-full cursor-pointer",
                        "border border-white/10 glass-whisper",
                        "transition-all duration-300",
                        "hover:shadow-[0_0_20px_rgb(var(--aurora-violet)/0.2)]",
                      )}
                    >
                      <Avatar
                        src={user?.avatarIpfsHash ?? undefined}
                        fallback={userFallback}
                        size="sm"
                        className="ring-0 bg-transparent"
                      />
                    </motion.div>
                  }
                >
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-sm font-body font-semibold text-foreground truncate max-w-[180px]">
                      {user?.displayName ?? "User"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-[180px] mt-0.5">
                      {user?.walletAddress
                        ? formatAddress(user.walletAddress, 8, 6)
                        : "No wallet"}
                    </p>
                  </div>
                  <DropdownItem
                    icon={
                      isDark ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )
                    }
                    onClick={toggleTheme}
                  >
                    {isDark ? "Light Mode" : "Dark Mode"}
                  </DropdownItem>
                  <DropdownItem icon={<Settings className="h-4 w-4" />}>
                    Settings
                  </DropdownItem>
                  <DropdownItem
                    icon={<LogOut className="h-4 w-4" />}
                    destructive
                    onClick={handleLogout}
                  >
                    Logout
                  </DropdownItem>
                </Dropdown>
              ) : null}
            </motion.div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {showConnectModal && (
          <ConnectWalletModal onClose={() => setShowConnectModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function ConnectWalletModal({ onClose }: { onClose: () => void }) {
  const { connect, isConnecting, error } = useWalletStore();

  const handleConnect = async () => {
    try {
      await connect();
      onClose();
    } catch {
      // error set in store
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm rounded-2xl glass-premium p-6 depth-4"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full glass-strong">
          <Wallet className="h-6 w-6 text-aurora-violet" />
        </div>
        <h3 className="text-lg font-heading font-bold gradient-text-extended mb-1.5">
          Connect Wallet
        </h3>
        <p className="text-sm text-muted-foreground font-body mb-5">
          Connect your Freighter wallet to access Stellar features.
        </p>

        {error && (
          <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-red-400 font-body">
            {error}
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          className="w-full rounded-xl font-heading"
          leftIcon={<Wallet className="h-5 w-5" />}
          isLoading={isConnecting}
          onClick={handleConnect}
        >
          {isConnecting ? "Connecting..." : "Connect Freighter"}
        </Button>

        <p className="mt-3 text-center text-xs text-muted-foreground font-body">
          Don&apos;t have Freighter?{" "}
          <a
            href="https://freighter.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[rgb(var(--aurora-cyan))] hover:underline transition-colors"
          >
            Install it here
          </a>
        </p>
      </motion.div>
    </motion.div>
  );
}

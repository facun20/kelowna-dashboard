"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Landmark,
  ShieldAlert,
  Home,
  Newspaper,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/business", label: "Business", icon: Building2 },
  { href: "/housing", label: "Housing", icon: Home },
  { href: "/council", label: "Council", icon: Landmark },
  { href: "/crime", label: "Crime", icon: ShieldAlert },
  { href: "/real-estate", label: "Real Estate", icon: TrendingUp },
  { href: "/news", label: "News", icon: Newspaper },
];

export function TabNav() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--nav-bg)] backdrop-blur-sm border-b border-[var(--card-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-8">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">K</span>
            </div>
            <span className="text-[var(--text-primary)] font-semibold text-sm hidden sm:block">
              Kelowna Intel
            </span>
          </Link>

          {/* Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors",
                    isActive
                      ? "text-[var(--text-primary)] bg-[var(--nav-active)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]"
                  )}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

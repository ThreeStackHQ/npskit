"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/surveys", label: "Surveys", icon: ClipboardList },
  { href: "/dashboard/responses", label: "Responses", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function getBreadcrumb(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 1) return "Dashboard";
  return segments
    .slice(1)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" / ");
}

function getInitials(email?: string | null) {
  if (!email) return "U";
  const parts = email.split("@")[0].split(/[._-]/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

interface Props {
  email?: string | null;
  children: React.ReactNode;
}

export default function DashboardSidebar({ email, children }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-7 h-7 bg-sky-500 rounded-md flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">N</span>
          </div>
          <span className="font-bold text-white text-lg">NPSKit</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-sky-500/10 text-sky-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: email */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 truncate">{email}</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-gray-900 border-r border-gray-800 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-gray-900 border-r border-gray-800 transform transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-gray-950 border-b border-gray-800 flex items-center px-4 gap-3 shrink-0">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <span className="text-sm text-gray-400 flex-1">
            {getBreadcrumb(pathname)}
          </span>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <Bell className="w-5 h-5" />
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <span className="text-xs font-bold text-sky-400">
                {getInitials(email)}
              </span>
            </div>

            {/* Logout */}
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

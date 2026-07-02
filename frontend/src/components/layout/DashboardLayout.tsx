"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType, type SVGProps } from "react";

import { useAuth } from "@/components/providers/AuthProvider";
import { formatRole } from "@/lib/auth/rbac";
import {
  IconAppointments,
  IconChevronLeft,
  IconDashboard,
  IconDepartments,
  IconDoctors,
  IconLogout,
  IconMenu,
  IconPatients,
  IconPulse,
  IconRecords,
} from "@/components/ui/icons";
import type { UserRole } from "@/types/user";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

type NavItem = {
  href: string;
  label: string;
  icon: IconType;
  exact?: boolean;
  hideFor?: UserRole[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: IconDashboard, exact: true },
  { href: "/dashboard/patients", label: "Patients", icon: IconPatients },
  { href: "/dashboard/doctors", label: "Doctors", icon: IconDoctors },
  { href: "/dashboard/departments", label: "Departments", icon: IconDepartments },
  { href: "/dashboard/appointments", label: "Appointments", icon: IconAppointments },
  { href: "/dashboard/medical-records", label: "Medical Records", icon: IconRecords },
];

const COLLAPSE_KEY = "hms.sidebar.collapsed";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <span className="inline-flex items-center gap-3 text-slate-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
          Loading...
        </span>
      </div>
    );
  }

  const navItems = NAV_ITEMS.filter(
    (item) => !item.hideFor || !item.hideFor.includes(user.role),
  );

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const brandMark = (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
      <IconPulse className="h-5 w-5" />
    </span>
  );

  const navLinks = (compact: boolean) => (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => {
        const active = isActive(item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={compact ? item.label : undefined}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } ${compact ? "justify-center" : ""}`}
          >
            <Icon
              className={`h-5 w-5 shrink-0 ${
                active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
              }`}
            />
            {!compact && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const userFooter = (compact: boolean) => (
    <div className="border-t border-slate-100 p-3">
      {compact ? (
        <button
          onClick={() => logout()}
          title="Sign out"
          className="flex w-full items-center justify-center rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <IconLogout className="h-5 w-5" />
        </button>
      ) : (
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {(user.first_name?.[0] ?? user.email[0]).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {user.first_name} {user.last_name}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
              {formatRole(user.role)}
            </span>
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            >
              <IconLogout className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 md:flex ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
          {brandMark}
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">HMS Care</p>
              <p className="truncate text-xs text-slate-400">Hospital Management</p>
            </div>
          )}
        </div>
        {navLinks(collapsed)}
        <button
          onClick={toggleCollapsed}
          className="mx-3 mb-2 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50"
        >
          <IconChevronLeft
            className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
          {!collapsed && "Collapse"}
        </button>
        {userFooter(collapsed)}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 animate-fade-in flex-col border-r border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <div className="flex items-center gap-3">
                {brandMark}
                <div>
                  <p className="text-sm font-bold text-slate-900">HMS Care</p>
                  <p className="text-xs text-slate-400">Hospital Management</p>
                </div>
              </div>
            </div>
            {navLinks(false)}
            {userFooter(false)}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
            aria-label="Open menu"
          >
            <IconMenu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            {brandMark}
            <span className="text-sm font-bold text-slate-900">HMS Care</span>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            {(user.first_name?.[0] ?? user.email[0]).toUpperCase()}
          </span>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

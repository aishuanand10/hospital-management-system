"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/AuthProvider";
import { formatRole } from "@/lib/auth/rbac";
import type { UserRole } from "@/types/user";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  hideFor?: UserRole[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/patients", label: "Patients" },
  { href: "/dashboard/doctors", label: "Doctors" },
  { href: "/dashboard/departments", label: "Departments" },
  { href: "/dashboard/appointments", label: "Appointments" },
  { href: "/dashboard/medical-records", label: "Medical Records" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  const navItems = NAV_ITEMS.filter(
    (item) => !item.hideFor || !item.hideFor.includes(user.role),
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-sm font-semibold text-blue-600">Hospital Management</p>
          <p className="text-xs text-slate-500">Milestone 2</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 px-4 py-4">
          <p className="truncate text-sm font-medium text-slate-900">
            {user.first_name} {user.last_name}
          </p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
          <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            {formatRole(user.role)}
          </span>
          <button
            onClick={() => logout()}
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-6 py-4 md:hidden">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-blue-600">HMS</p>
            <button
              onClick={() => logout()}
              className="text-sm text-slate-600"
            >
              Sign out
            </button>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}

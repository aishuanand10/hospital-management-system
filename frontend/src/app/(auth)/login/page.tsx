"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/AuthProvider";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/PageHeader";
import {
  IconAppointments,
  IconPatients,
  IconPulse,
  IconRecords,
} from "@/components/ui/icons";

const HIGHLIGHTS = [
  { icon: IconPatients, label: "Unified patient records" },
  { icon: IconAppointments, label: "Smart appointment scheduling" },
  { icon: IconRecords, label: "Complete medical history" },
];

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@hospital.com");
  const [password, setPassword] = useState("adminpassword123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) {
    router.replace("/dashboard");
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-3 text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <IconPulse className="h-6 w-6" />
          </span>
          <span className="text-lg font-bold tracking-tight">HMS Care</span>
        </div>

        <div className="text-white">
          <h2 className="max-w-md text-3xl font-bold leading-tight">
            Modern hospital operations, all in one place.
          </h2>
          <p className="mt-3 max-w-md text-brand-100">
            Manage patients, doctors, departments, and appointments with a secure,
            role-based platform built for care teams.
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-brand-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-brand-200">
          Secure access for authorized hospital staff only.
        </p>

        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-10 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <IconPulse className="h-6 w-6" />
            </span>
            <span className="text-lg font-bold text-slate-900">HMS Care</span>
          </div>

          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Hospital Management System
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Sign in with your hospital account to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Email" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@hospital.com"
                autoComplete="email"
              />
            </Field>

            <Field label="Password" htmlFor="password" required>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </Field>

            {error && <Alert>{error}</Alert>}

            <Button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full py-2.5"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
            Demo credentials: <span className="font-medium text-slate-700">admin@hospital.com</span>{" "}
            / <span className="font-medium text-slate-700">adminpassword123</span>
          </div>
        </div>
      </div>
    </div>
  );
}

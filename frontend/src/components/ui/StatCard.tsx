import Link from "next/link";
import type { ReactNode } from "react";

type Tone = "teal" | "blue" | "amber" | "purple" | "green";

const TONES: Record<Tone, string> = {
  teal: "bg-brand-50 text-brand-600",
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  purple: "bg-purple-50 text-purple-600",
  green: "bg-emerald-50 text-emerald-600",
};

export function StatCard({
  label,
  value,
  icon,
  href,
  tone = "teal",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  href?: string;
  tone?: Tone;
}) {
  const content = (
    <div className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
      {icon && (
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getDashboardStats,
  getDepartmentStats,
  getDoctorWorkload,
  getPatientActivity,
  getRecentActivity,
  getRecentAppointments,
} from "@/lib/api/dashboard";
import type {
  ActivityItem,
  DashboardStats,
  DepartmentStat,
  DoctorWorkload,
  PatientActivitySummary,
  RecentAppointment,
} from "@/types/dashboard";
import { formatAppointmentStatus } from "@/types/appointment";

function StatCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const content = (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block transition hover:opacity-90">
        {content}
      </Link>
    );
  }
  return content;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [deptStats, setDeptStats] = useState<DepartmentStat[]>([]);
  const [workload, setWorkload] = useState<DoctorWorkload[]>([]);
  const [recentAppts, setRecentAppts] = useState<RecentAppointment[]>([]);
  const [patientActivity, setPatientActivity] = useState<PatientActivitySummary[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [
          statsData,
          activityData,
          deptData,
          workloadData,
          recentApptData,
          patientActivityData,
        ] = await Promise.all([
          getDashboardStats(),
          getRecentActivity(8),
          getDepartmentStats(),
          getDoctorWorkload(),
          getRecentAppointments(6),
          getPatientActivity(6),
        ]);
        setStats(statsData);
        setActivity(activityData.results);
        setDeptStats(deptData.results);
        setWorkload(workloadData.results);
        setRecentAppts(recentApptData.results);
        setPatientActivity(patientActivityData.results);
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <p className="text-slate-500">Loading dashboard...</p>;
  }

  if (error || !stats) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        {error || "Unable to load dashboard."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">Hospital operations overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Active Patients" value={stats.total_patients} href="/dashboard/patients" />
        <StatCard label="Active Doctors" value={stats.total_doctors} href="/dashboard/doctors" />
        <StatCard label="Departments" value={stats.total_departments} href="/dashboard/departments" />
        <StatCard label="Appointments Today" value={stats.appointments_today} href="/dashboard/appointments" />
        <StatCard label="Medical Records" value={stats.total_medical_records} href="/dashboard/medical-records" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Appointment Summary</h2>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <dt className="text-slate-500">Total appointments</dt>
              <dd className="font-medium text-slate-900">{stats.total_appointments}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-slate-500">Pending</dt>
              <dd className="font-medium text-slate-900">{stats.appointments_pending}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-slate-500">Completed</dt>
              <dd className="font-medium text-slate-900">{stats.appointments_completed}</dd>
            </div>
          </dl>
          {Object.keys(stats.appointments_by_status).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(stats.appointments_by_status).map(([status, count]) => (
                <span
                  key={status}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {formatAppointmentStatus(status as never)}: {count}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent Appointments</h2>
          {recentAppts.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No recent appointments.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentAppts.map((a) => (
                <li key={a.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{a.patient_name}</p>
                    <p className="text-xs text-slate-500">{a.doctor_name} - {formatTimestamp(a.scheduled_at)}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {formatAppointmentStatus(a.status as never)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Department Statistics</h2>
          {deptStats.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No departments configured.</p>
          ) : (
            <table className="mt-4 min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-2">Department</th>
                  <th className="pb-2 text-right">Doctors</th>
                  <th className="pb-2 text-right">Appointments</th>
                </tr>
              </thead>
              <tbody>
                {deptStats.map((d) => (
                  <tr key={d.id} className="border-t border-slate-100">
                    <td className="py-2 font-medium text-slate-900">{d.name}</td>
                    <td className="py-2 text-right text-slate-600">{d.doctor_count}</td>
                    <td className="py-2 text-right text-slate-600">{d.appointment_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Doctor Workload</h2>
          {workload.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No doctors found.</p>
          ) : (
            <table className="mt-4 min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-2">Doctor</th>
                  <th className="pb-2 text-right">Today</th>
                  <th className="pb-2 text-right">Upcoming</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {workload.map((d) => (
                  <tr key={d.id} className="border-t border-slate-100">
                    <td className="py-2 font-medium text-slate-900">{d.name}</td>
                    <td className="py-2 text-right text-slate-600">{d.today_appointments}</td>
                    <td className="py-2 text-right text-slate-600">{d.upcoming_appointments}</td>
                    <td className="py-2 text-right text-slate-600">{d.total_appointments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Patient Activity</h2>
          {patientActivity.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No patient activity.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {patientActivity.map((p) => (
                <li key={p.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.medical_record_number}</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {p.appointment_count} appts - {p.record_count} records
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No recent activity.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {activity.map((item) => (
                <li key={`${item.type}-${item.id}`} className="border-b border-slate-100 pb-3 last:border-0">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatTimestamp(item.timestamp)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

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
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { BarChart } from "@/components/ui/BarChart";
import { Alert } from "@/components/ui/PageHeader";
import {
  IconActivity,
  IconAppointments,
  IconDepartments,
  IconDoctors,
  IconPatients,
  IconRecords,
} from "@/components/ui/icons";

const STATUS_TONES: Record<string, BadgeTone> = {
  scheduled: "blue",
  confirmed: "green",
  completed: "gray",
  cancelled: "red",
  no_show: "amber",
};

function statusTone(status: string): BadgeTone {
  return STATUS_TONES[status] ?? "gray";
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
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="inline-flex items-center gap-3 text-slate-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
          Loading dashboard...
        </span>
      </div>
    );
  }

  if (error || !stats) {
    return <Alert>{error || "Unable to load dashboard."}</Alert>;
  }

  const workloadData = workload
    .slice()
    .sort((a, b) => b.upcoming_appointments - a.upcoming_appointments)
    .slice(0, 6)
    .map((d) => ({
      label: d.name,
      value: d.upcoming_appointments,
      sublabel: `${d.upcoming_appointments} upcoming`,
    }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Hospital operations overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Active Patients"
          value={stats.total_patients}
          href="/dashboard/patients"
          icon={<IconPatients className="h-6 w-6" />}
          tone="teal"
        />
        <StatCard
          label="Active Doctors"
          value={stats.total_doctors}
          href="/dashboard/doctors"
          icon={<IconDoctors className="h-6 w-6" />}
          tone="blue"
        />
        <StatCard
          label="Departments"
          value={stats.total_departments}
          href="/dashboard/departments"
          icon={<IconDepartments className="h-6 w-6" />}
          tone="purple"
        />
        <StatCard
          label="Appointments Today"
          value={stats.appointments_today}
          href="/dashboard/appointments"
          icon={<IconAppointments className="h-6 w-6" />}
          tone="amber"
        />
        <StatCard
          label="Medical Records"
          value={stats.total_medical_records}
          href="/dashboard/medical-records"
          icon={<IconRecords className="h-6 w-6" />}
          tone="green"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader
            title="Appointment Summary"
            icon={<IconAppointments className="h-5 w-5" />}
          />
          <CardBody>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {stats.total_appointments}
                </p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {stats.appointments_pending}
                </p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.appointments_completed}
                </p>
                <p className="text-xs text-slate-500">Completed</p>
              </div>
            </div>
            {Object.keys(stats.appointments_by_status).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(stats.appointments_by_status).map(([status, count]) => (
                  <Badge key={status} tone={statusTone(status)}>
                    {formatAppointmentStatus(status as never)}: {count}
                  </Badge>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Doctor Workload"
            subtitle="Upcoming appointments by doctor"
            icon={<IconDoctors className="h-5 w-5" />}
          />
          <CardBody>
            <BarChart data={workloadData} emptyMessage="No doctors found." />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent Appointments"
            icon={<IconAppointments className="h-5 w-5" />}
          />
          <CardBody className="py-2">
            {recentAppts.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                No recent appointments.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentAppts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {a.patient_name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {a.doctor_name} - {formatTimestamp(a.scheduled_at)}
                      </p>
                    </div>
                    <Badge tone={statusTone(a.status)}>
                      {formatAppointmentStatus(a.status as never)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Department Statistics"
            icon={<IconDepartments className="h-5 w-5" />}
          />
          <CardBody className="py-2">
            {deptStats.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                No departments configured.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="pb-2">Department</th>
                      <th className="pb-2 text-right">Doctors</th>
                      <th className="pb-2 text-right">Appointments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deptStats.map((d) => (
                      <tr key={d.id}>
                        <td className="py-2.5 font-medium text-slate-900">{d.name}</td>
                        <td className="py-2.5 text-right text-slate-600">
                          {d.doctor_count}
                        </td>
                        <td className="py-2.5 text-right text-slate-600">
                          {d.appointment_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Patient Activity"
            icon={<IconPatients className="h-5 w-5" />}
          />
          <CardBody className="py-2">
            {patientActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                No patient activity.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {patientActivity.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {p.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {p.medical_record_number}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-xs text-slate-500">
                      {p.appointment_count} appts - {p.record_count} records
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent Activity"
            icon={<IconActivity className="h-5 w-5" />}
          />
          <CardBody className="py-2">
            {activity.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                No recent activity.
              </p>
            ) : (
              <ul className="space-y-4 py-2">
                {activity.map((item) => (
                  <li key={`${item.type}-${item.id}`} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.description}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatTimestamp(item.timestamp)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

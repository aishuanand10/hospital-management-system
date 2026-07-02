import { apiFetch } from "@/lib/api/client";
import type {
  DashboardStats,
  DepartmentStat,
  DoctorWorkload,
  PatientActivitySummary,
  RecentActivity,
  RecentAppointment,
} from "@/types/dashboard";

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/dashboard/stats/");
}

export async function getRecentActivity(limit = 10): Promise<RecentActivity> {
  return apiFetch<RecentActivity>(`/dashboard/recent-activity/?limit=${limit}`);
}

export async function getRecentAppointments(
  limit = 10,
): Promise<{ results: RecentAppointment[] }> {
  return apiFetch<{ results: RecentAppointment[] }>(
    `/dashboard/recent-appointments/?limit=${limit}`,
  );
}

export async function getDepartmentStats(): Promise<{
  results: DepartmentStat[];
}> {
  return apiFetch<{ results: DepartmentStat[] }>(
    "/dashboard/department-stats/",
  );
}

export async function getDoctorWorkload(): Promise<{
  results: DoctorWorkload[];
}> {
  return apiFetch<{ results: DoctorWorkload[] }>("/dashboard/doctor-workload/");
}

export async function getPatientActivity(
  limit = 10,
): Promise<{ results: PatientActivitySummary[] }> {
  return apiFetch<{ results: PatientActivitySummary[] }>(
    `/dashboard/patient-activity/?limit=${limit}`,
  );
}

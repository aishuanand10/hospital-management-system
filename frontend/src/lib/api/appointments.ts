import { apiFetch } from "@/lib/api/client";
import type {
  Appointment,
  AppointmentInput,
  DoctorAvailability,
  DoctorAvailabilityInput,
} from "@/types/appointment";
import type { PaginatedResponse } from "@/types/dashboard";

export async function listAppointments(
  search?: string,
): Promise<PaginatedResponse<Appointment>> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const query = params.toString();
  return apiFetch<PaginatedResponse<Appointment>>(
    `/appointments/${query ? `?${query}` : ""}`,
  );
}

export async function getAppointment(id: string): Promise<Appointment> {
  return apiFetch<Appointment>(`/appointments/${id}/`);
}

export async function createAppointment(
  data: AppointmentInput,
): Promise<Appointment> {
  return apiFetch<Appointment>("/appointments/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAppointment(
  id: string,
  data: Partial<AppointmentInput>,
): Promise<Appointment> {
  return apiFetch<Appointment>(`/appointments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAppointment(id: string): Promise<void> {
  await apiFetch(`/appointments/${id}/`, { method: "DELETE" });
}

export async function rescheduleAppointment(
  id: string,
  scheduledAt: string,
  durationMinutes?: number,
): Promise<Appointment> {
  return apiFetch<Appointment>(`/appointments/${id}/reschedule/`, {
    method: "POST",
    body: JSON.stringify({
      scheduled_at: scheduledAt,
      ...(durationMinutes ? { duration_minutes: durationMinutes } : {}),
    }),
  });
}

export async function listAvailabilities(
  doctorId?: string,
): Promise<PaginatedResponse<DoctorAvailability>> {
  const params = new URLSearchParams();
  if (doctorId) params.set("doctor", doctorId);
  const query = params.toString();
  return apiFetch<PaginatedResponse<DoctorAvailability>>(
    `/availabilities/${query ? `?${query}` : ""}`,
  );
}

export async function createAvailability(
  data: DoctorAvailabilityInput,
): Promise<DoctorAvailability> {
  return apiFetch<DoctorAvailability>("/availabilities/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteAvailability(id: string): Promise<void> {
  await apiFetch(`/availabilities/${id}/`, { method: "DELETE" });
}

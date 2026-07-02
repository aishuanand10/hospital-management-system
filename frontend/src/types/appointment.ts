import type { Doctor } from "./doctor";
import type { Patient } from "./patient";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Appointment {
  id: string;
  patient: string;
  patient_name: string;
  patient_detail?: Patient;
  doctor: string;
  doctor_name: string;
  doctor_detail?: Doctor;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  reason: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type AppointmentInput = {
  patient: string;
  doctor: string;
  scheduled_at: string;
  duration_minutes?: number;
  status?: AppointmentStatus;
  reason: string;
  notes?: string;
};

export const APPOINTMENT_STATUS_OPTIONS: {
  value: AppointmentStatus;
  label: string;
}[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

export function formatAppointmentStatus(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export interface DoctorAvailability {
  id: string;
  doctor: string;
  doctor_name: string;
  weekday: number;
  weekday_display: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}

export type DoctorAvailabilityInput = {
  doctor: string;
  weekday: number;
  start_time: string;
  end_time: string;
  is_available?: boolean;
};

export const WEEKDAY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

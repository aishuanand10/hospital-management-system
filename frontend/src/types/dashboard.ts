export interface DashboardStats {
  total_patients: number;
  total_doctors: number;
  total_departments: number;
  total_appointments: number;
  total_medical_records: number;
  appointments_today: number;
  appointments_upcoming: number;
  appointments_pending: number;
  appointments_completed: number;
  appointments_by_status: Record<string, number>;
}

export interface DepartmentStat {
  id: string;
  name: string;
  code: string;
  doctor_count: number;
  appointment_count: number;
}

export interface DoctorWorkload {
  id: string;
  name: string;
  specialty: string;
  total_appointments: number;
  today_appointments: number;
  upcoming_appointments: number;
}

export interface PatientActivitySummary {
  id: string;
  name: string;
  medical_record_number: string;
  appointment_count: number;
  record_count: number;
  created_at: string;
}

export interface RecentAppointment {
  id: string;
  patient: string;
  patient_name: string;
  doctor: string;
  doctor_name: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  reason: string;
  created_at: string;
}

export interface ActivityItem {
  type: "appointment" | "patient";
  id: string;
  title: string;
  description: string;
  status: string;
  timestamp: string;
}

export interface RecentActivity {
  results: ActivityItem[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

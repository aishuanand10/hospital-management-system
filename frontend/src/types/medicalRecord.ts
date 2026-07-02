import type { Patient } from "./patient";

export type VisitType =
  | "consultation"
  | "follow_up"
  | "emergency"
  | "lab"
  | "other";

export type AllergySeverity = "mild" | "moderate" | "severe";

export interface Prescription {
  id: string;
  medical_record?: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  created_at?: string;
}

export interface MedicalRecord {
  id: string;
  patient: string;
  patient_name: string;
  doctor: string | null;
  doctor_name: string | null;
  appointment: string | null;
  record_date: string;
  visit_type: VisitType;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  prescriptions: Prescription[];
  created_at: string;
  updated_at: string;
}

export type MedicalRecordInput = {
  patient: string;
  doctor?: string | null;
  appointment?: string | null;
  record_date?: string;
  visit_type: VisitType;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  prescriptions?: Partial<Prescription>[];
};

export interface Allergy {
  id: string;
  patient: string;
  patient_name: string;
  allergen: string;
  reaction: string;
  severity: AllergySeverity;
  notes: string;
  recorded_by: string | null;
  recorded_at: string;
}

export interface PatientTimeline {
  patient: Patient;
  records: MedicalRecord[];
  allergies: Allergy[];
}

export const VISIT_TYPE_OPTIONS: { value: VisitType; label: string }[] = [
  { value: "consultation", label: "Consultation" },
  { value: "follow_up", label: "Follow-up" },
  { value: "emergency", label: "Emergency" },
  { value: "lab", label: "Lab / Diagnostics" },
  { value: "other", label: "Other" },
];

export const ALLERGY_SEVERITY_OPTIONS: {
  value: AllergySeverity;
  label: string;
}[] = [
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
];

export function formatVisitType(value: VisitType): string {
  return VISIT_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

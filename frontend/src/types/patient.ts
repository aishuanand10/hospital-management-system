export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-"
  | "unknown";

export interface Patient {
  id: string;
  medical_record_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: Gender;
  blood_group: BloodGroup;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PatientInput = Omit<
  Patient,
  "id" | "full_name" | "created_at" | "updated_at"
>;

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const BLOOD_GROUP_OPTIONS: { value: BloodGroup; label: string }[] = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
  { value: "unknown", label: "Unknown" },
];

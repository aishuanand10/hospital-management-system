export interface Doctor {
  id: string;
  user: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  specialty: string;
  license_number: string;
  department: string;
  department_ref: string | null;
  department_name: string | null;
  years_of_experience: number;
  consultation_fee: string;
  bio: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DoctorInput = Omit<
  Doctor,
  "id" | "full_name" | "department_name" | "created_at" | "updated_at"
>;

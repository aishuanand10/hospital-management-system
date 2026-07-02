export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  location: string;
  phone: string;
  head_doctor: string | null;
  head_doctor_name: string | null;
  doctor_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DepartmentInput = {
  name: string;
  code: string;
  description?: string;
  location?: string;
  phone?: string;
  head_doctor?: string | null;
  is_active?: boolean;
};

export interface DepartmentDoctor {
  id: string;
  full_name: string;
  specialty: string;
  email: string;
  phone: string;
  is_active: boolean;
}

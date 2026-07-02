import { apiFetch } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/dashboard";
import type { Patient, PatientInput } from "@/types/patient";

export async function listPatients(
  search?: string,
): Promise<PaginatedResponse<Patient>> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const query = params.toString();
  return apiFetch<PaginatedResponse<Patient>>(`/patients/${query ? `?${query}` : ""}`);
}

export async function getPatient(id: string): Promise<Patient> {
  return apiFetch<Patient>(`/patients/${id}/`);
}

export async function createPatient(data: Partial<PatientInput>): Promise<Patient> {
  return apiFetch<Patient>("/patients/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePatient(
  id: string,
  data: Partial<PatientInput>,
): Promise<Patient> {
  return apiFetch<Patient>(`/patients/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deletePatient(id: string): Promise<void> {
  await apiFetch(`/patients/${id}/`, { method: "DELETE" });
}

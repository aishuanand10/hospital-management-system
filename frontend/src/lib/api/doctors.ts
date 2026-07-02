import { apiFetch } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/dashboard";
import type { Doctor, DoctorInput } from "@/types/doctor";

export async function listDoctors(
  search?: string,
): Promise<PaginatedResponse<Doctor>> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const query = params.toString();
  return apiFetch<PaginatedResponse<Doctor>>(`/doctors/${query ? `?${query}` : ""}`);
}

export async function getDoctor(id: string): Promise<Doctor> {
  return apiFetch<Doctor>(`/doctors/${id}/`);
}

export async function createDoctor(data: Partial<DoctorInput>): Promise<Doctor> {
  return apiFetch<Doctor>("/doctors/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDoctor(
  id: string,
  data: Partial<DoctorInput>,
): Promise<Doctor> {
  return apiFetch<Doctor>(`/doctors/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteDoctor(id: string): Promise<void> {
  await apiFetch(`/doctors/${id}/`, { method: "DELETE" });
}

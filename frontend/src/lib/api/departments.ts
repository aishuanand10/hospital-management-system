import { apiFetch } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/dashboard";
import type {
  Department,
  DepartmentDoctor,
  DepartmentInput,
} from "@/types/department";

export async function listDepartments(
  search?: string,
): Promise<PaginatedResponse<Department>> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const query = params.toString();
  return apiFetch<PaginatedResponse<Department>>(
    `/departments/${query ? `?${query}` : ""}`,
  );
}

export async function getDepartment(id: string): Promise<Department> {
  return apiFetch<Department>(`/departments/${id}/`);
}

export async function createDepartment(
  data: DepartmentInput,
): Promise<Department> {
  return apiFetch<Department>("/departments/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDepartment(
  id: string,
  data: Partial<DepartmentInput>,
): Promise<Department> {
  return apiFetch<Department>(`/departments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiFetch(`/departments/${id}/`, { method: "DELETE" });
}

export async function getDepartmentDoctors(
  id: string,
): Promise<DepartmentDoctor[]> {
  return apiFetch<DepartmentDoctor[]>(`/departments/${id}/doctors/`);
}

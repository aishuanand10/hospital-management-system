import { apiFetch } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/dashboard";
import type {
  Allergy,
  MedicalRecord,
  MedicalRecordInput,
  PatientTimeline,
} from "@/types/medicalRecord";

export async function listMedicalRecords(
  patientId?: string,
): Promise<PaginatedResponse<MedicalRecord>> {
  const params = new URLSearchParams();
  if (patientId) params.set("patient", patientId);
  const query = params.toString();
  return apiFetch<PaginatedResponse<MedicalRecord>>(
    `/medical-records/${query ? `?${query}` : ""}`,
  );
}

export async function createMedicalRecord(
  data: MedicalRecordInput,
): Promise<MedicalRecord> {
  return apiFetch<MedicalRecord>("/medical-records/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMedicalRecord(
  id: string,
  data: Partial<MedicalRecordInput>,
): Promise<MedicalRecord> {
  return apiFetch<MedicalRecord>(`/medical-records/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteMedicalRecord(id: string): Promise<void> {
  await apiFetch(`/medical-records/${id}/`, { method: "DELETE" });
}

export async function getPatientTimeline(
  patientId: string,
): Promise<PatientTimeline> {
  return apiFetch<PatientTimeline>(`/patients/${patientId}/timeline/`);
}

export async function listAllergies(
  patientId?: string,
): Promise<PaginatedResponse<Allergy>> {
  const params = new URLSearchParams();
  if (patientId) params.set("patient", patientId);
  const query = params.toString();
  return apiFetch<PaginatedResponse<Allergy>>(
    `/allergies/${query ? `?${query}` : ""}`,
  );
}

export async function createAllergy(
  data: Partial<Allergy>,
): Promise<Allergy> {
  return apiFetch<Allergy>("/allergies/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteAllergy(id: string): Promise<void> {
  await apiFetch(`/allergies/${id}/`, { method: "DELETE" });
}

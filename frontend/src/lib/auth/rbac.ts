import type { UserRole } from "@/types/user";

export const ADMIN_ROLES: UserRole[] = ["super_admin", "hospital_admin"];

export type Resource =
  | "patients"
  | "doctors"
  | "departments"
  | "appointments"
  | "availabilities"
  | "medical_records";

/**
 * Roles allowed to write (create/update/delete) each resource, mirroring the
 * backend permission classes. Admin roles can always write.
 */
const WRITE_ROLES: Record<Resource, UserRole[]> = {
  patients: ["receptionist"],
  doctors: [],
  departments: [],
  appointments: ["receptionist", "doctor"],
  availabilities: ["doctor"],
  medical_records: ["doctor"],
};

export function isAdmin(role?: UserRole | null): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}

export function canWrite(resource: Resource, role?: UserRole | null): boolean {
  if (!role) return false;
  if (isAdmin(role)) return true;
  return WRITE_ROLES[resource].includes(role);
}

export function formatRole(role: string): string {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

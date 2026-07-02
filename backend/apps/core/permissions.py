"""Role-based access control permissions for Milestone 2.

Read access (safe methods) is granted to any authenticated user. Write access
is granted to admin roles plus a per-resource allow-list of additional roles.
Object-level data scoping for the ``patient`` role is handled in each view's
``get_queryset``.
"""

from rest_framework.permissions import SAFE_METHODS, BasePermission

ADMIN_ROLES = {"super_admin", "hospital_admin"}
DOCTOR_ROLE = "doctor"
RECEPTIONIST_ROLE = "receptionist"
PATIENT_ROLE = "patient"


def get_role(user):
    return getattr(user, "role", None)


def is_admin(user):
    return bool(user and (user.is_superuser or get_role(user) in ADMIN_ROLES))


class RoleBasedPermission(BasePermission):
    """Base permission: authenticated read for all, role-gated writes.

    Subclasses declare ``write_roles`` (in addition to admin roles).
    """

    write_roles: set = set()

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        if is_admin(user):
            return True
        return get_role(user) in self.write_roles


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_admin(request.user)


class PatientAccess(RoleBasedPermission):
    write_roles = {RECEPTIONIST_ROLE}


class DoctorAccess(RoleBasedPermission):
    write_roles = set()  # admin only


class DepartmentAccess(RoleBasedPermission):
    write_roles = set()  # admin only


class AppointmentAccess(RoleBasedPermission):
    write_roles = {RECEPTIONIST_ROLE, DOCTOR_ROLE}


class AvailabilityAccess(RoleBasedPermission):
    write_roles = {DOCTOR_ROLE}


class MedicalRecordAccess(RoleBasedPermission):
    write_roles = {DOCTOR_ROLE}

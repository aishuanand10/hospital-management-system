"""Helpers for scoping querysets to the ``patient`` role's own data."""

from apps.core.permissions import PATIENT_ROLE, get_role


def patient_for_user(user):
    """Return the Patient linked to a patient-role user (matched by email)."""
    from apps.patients.models import Patient

    if not user or not user.is_authenticated:
        return None
    return Patient.objects.filter(email__iexact=user.email).first()


def scope_to_patient(user, queryset, patient_field="patient"):
    """Restrict ``queryset`` to the current user's own patient record.

    Only applies to the ``patient`` role; all other roles are unaffected.
    """
    if get_role(user) != PATIENT_ROLE:
        return queryset
    patient = patient_for_user(user)
    if patient is None:
        return queryset.none()
    return queryset.filter(**{patient_field: patient})

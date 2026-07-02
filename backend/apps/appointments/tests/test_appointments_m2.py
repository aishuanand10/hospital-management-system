from datetime import time

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from apps.accounts.tests.conftest import (  # noqa: F401
    admin_user,
    auth_client,
    doctor_user,
    patient_user,
    receptionist_user,
)
from apps.appointments.models import Appointment
from apps.doctors.models import Doctor
from apps.patients.models import Patient


@pytest.fixture
def patient(db):
    return Patient.objects.create(
        medical_record_number="MRN-AP01",
        first_name="Alice",
        last_name="Johnson",
        email="pat@hospital.com",
        phone="555",
        date_of_birth="1990-01-01",
        gender="female",
    )


@pytest.fixture
def doctor(db):
    return Doctor.objects.create(
        first_name="Robert",
        last_name="Smith",
        email="rs@hospital.com",
        phone="555",
        specialty="Cardiology",
        license_number="MD-AP01",
        department="Cardiology",
    )


def _slot(days=1, hour=10):
    base = timezone.now() + timezone.timedelta(days=days)
    return base.replace(hour=hour, minute=0, second=0, microsecond=0)


@pytest.mark.django_db
class TestAppointmentConflict:
    def test_conflict_detected(self, admin_user, patient, doctor):
        client = auth_client(admin_user)
        slot = _slot()
        first = client.post(
            reverse("appointment-list"),
            {
                "patient": str(patient.id),
                "doctor": str(doctor.id),
                "scheduled_at": slot.isoformat(),
                "duration_minutes": 30,
                "reason": "Checkup",
            },
            format="json",
        )
        assert first.status_code == status.HTTP_201_CREATED

        overlap = client.post(
            reverse("appointment-list"),
            {
                "patient": str(patient.id),
                "doctor": str(doctor.id),
                "scheduled_at": (slot + timezone.timedelta(minutes=15)).isoformat(),
                "duration_minutes": 30,
                "reason": "Overlap",
            },
            format="json",
        )
        assert overlap.status_code == status.HTTP_400_BAD_REQUEST

    def test_reschedule(self, admin_user, patient, doctor):
        client = auth_client(admin_user)
        appt = Appointment.objects.create(
            patient=patient, doctor=doctor, scheduled_at=_slot(), reason="x"
        )
        new_slot = _slot(days=3, hour=14)
        response = client.post(
            reverse("appointment-reschedule", args=[appt.id]),
            {"scheduled_at": new_slot.isoformat()},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        appt.refresh_from_db()
        assert appt.scheduled_at.hour == 14

    def test_patient_sees_only_own_appointments(
        self, patient_user, patient, doctor
    ):
        Appointment.objects.create(
            patient=patient, doctor=doctor, scheduled_at=_slot(), reason="mine"
        )
        other = Patient.objects.create(
            medical_record_number="MRN-AP02",
            first_name="Bob",
            last_name="Other",
            email="other@email.com",
            phone="555",
            date_of_birth="1980-01-01",
            gender="male",
        )
        Appointment.objects.create(
            patient=other, doctor=doctor, scheduled_at=_slot(days=2), reason="theirs"
        )
        client = auth_client(patient_user)
        response = client.get(reverse("appointment-list"))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1


@pytest.mark.django_db
class TestDoctorAvailability:
    def test_doctor_can_create_availability(self, doctor_user, doctor):
        client = auth_client(doctor_user)
        response = client.post(
            reverse("availability-list"),
            {
                "doctor": str(doctor.id),
                "weekday": 0,
                "start_time": "09:00",
                "end_time": "17:00",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_invalid_time_range_rejected(self, doctor_user, doctor):
        client = auth_client(doctor_user)
        response = client.post(
            reverse("availability-list"),
            {
                "doctor": str(doctor.id),
                "weekday": 0,
                "start_time": "17:00",
                "end_time": "09:00",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_patient_cannot_create_availability(self, patient_user, doctor):
        client = auth_client(patient_user)
        response = client.post(
            reverse("availability-list"),
            {
                "doctor": str(doctor.id),
                "weekday": 0,
                "start_time": "09:00",
                "end_time": "17:00",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

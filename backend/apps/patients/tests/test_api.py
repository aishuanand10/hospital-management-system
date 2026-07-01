import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.tests.conftest import admin_user  # noqa: F401
from apps.doctors.models import Doctor
from apps.patients.models import Patient


@pytest.fixture
def patient(db):
    return Patient.objects.create(
        medical_record_number="MRN-TEST01",
        first_name="Test",
        last_name="Patient",
        email="test.patient@email.com",
        phone="555-9999",
        date_of_birth="1990-01-01",
        gender="male",
    )


@pytest.fixture
def doctor(db):
    return Doctor.objects.create(
        first_name="Test",
        last_name="Doctor",
        email="test.doctor@hospital.com",
        phone="555-8888",
        specialty="General Medicine",
        license_number="MD-TEST01",
        department="General",
    )


@pytest.mark.django_db
class TestPatientAPI:
    def test_list_patients_requires_auth(self):
        client = APIClient()
        response = client.get(reverse("patient-list"))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_and_list_patients(self, admin_user):
        from apps.accounts.tests.conftest import auth_client

        client = auth_client(admin_user)
        response = client.post(
            reverse("patient-list"),
            {
                "medical_record_number": "MRN-NEW01",
                "first_name": "Jane",
                "last_name": "Doe",
                "phone": "555-1234",
                "date_of_birth": "1988-06-15",
                "gender": "female",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["full_name"] == "Jane Doe"

        list_response = client.get(reverse("patient-list"))
        assert list_response.status_code == status.HTTP_200_OK
        assert list_response.data["count"] >= 1


@pytest.mark.django_db
class TestDoctorAPI:
    def test_create_doctor(self, admin_user):
        from apps.accounts.tests.conftest import auth_client

        client = auth_client(admin_user)
        response = client.post(
            reverse("doctor-list"),
            {
                "first_name": "John",
                "last_name": "Adams",
                "email": "john.adams@hospital.com",
                "phone": "555-4321",
                "specialty": "Neurology",
                "license_number": "MD-NEW01",
                "department": "Neurology",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert "Dr." in response.data["full_name"]


@pytest.mark.django_db
class TestAppointmentAPI:
    def test_create_appointment(self, admin_user, patient, doctor):
        from apps.accounts.tests.conftest import auth_client

        client = auth_client(admin_user)
        response = client.post(
            reverse("appointment-list"),
            {
                "patient": str(patient.id),
                "doctor": str(doctor.id),
                "scheduled_at": "2026-07-15T10:00:00Z",
                "reason": "General checkup",
                "status": "scheduled",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["patient_name"] == patient.full_name


@pytest.mark.django_db
class TestDashboardAPI:
    def test_dashboard_stats(self, admin_user, patient, doctor):
        from apps.accounts.tests.conftest import auth_client

        client = auth_client(admin_user)
        response = client.get(reverse("dashboard-stats"))
        assert response.status_code == status.HTTP_200_OK
        assert "total_patients" in response.data
        assert "total_doctors" in response.data
        assert response.data["total_patients"] >= 1

    def test_recent_activity(self, admin_user, patient):
        from apps.accounts.tests.conftest import auth_client

        client = auth_client(admin_user)
        response = client.get(reverse("dashboard-recent-activity"))
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data

import pytest
from django.urls import reverse
from rest_framework import status

from apps.accounts.tests.conftest import (  # noqa: F401
    admin_user,
    auth_client,
    doctor_user,
    patient_user,
    receptionist_user,
)
from apps.doctors.models import Doctor
from apps.patients.models import Patient


@pytest.mark.django_db
class TestRBAC:
    def test_unauthenticated_denied(self):
        from rest_framework.test import APIClient

        client = APIClient()
        assert client.get(reverse("patient-list")).status_code == 401
        assert client.get(reverse("doctor-list")).status_code == 401

    def test_receptionist_can_create_patient(self, receptionist_user):
        client = auth_client(receptionist_user)
        response = client.post(
            reverse("patient-list"),
            {
                "medical_record_number": "MRN-RB01",
                "first_name": "New",
                "last_name": "Patient",
                "phone": "555",
                "date_of_birth": "1990-01-01",
                "gender": "male",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_doctor_cannot_create_patient(self, doctor_user):
        client = auth_client(doctor_user)
        response = client.post(
            reverse("patient-list"),
            {
                "medical_record_number": "MRN-RB02",
                "first_name": "New",
                "last_name": "Patient",
                "phone": "555",
                "date_of_birth": "1990-01-01",
                "gender": "male",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_doctor_cannot_create_doctor(self, doctor_user):
        client = auth_client(doctor_user)
        response = client.post(
            reverse("doctor-list"),
            {
                "first_name": "X",
                "last_name": "Y",
                "email": "xy@hospital.com",
                "phone": "555",
                "specialty": "Cardiology",
                "license_number": "MD-RB01",
                "department": "Cardiology",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_create_doctor(self, admin_user):
        client = auth_client(admin_user)
        response = client.post(
            reverse("doctor-list"),
            {
                "first_name": "X",
                "last_name": "Y",
                "email": "xy@hospital.com",
                "phone": "555",
                "specialty": "Cardiology",
                "license_number": "MD-RB02",
                "department": "Cardiology",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_receptionist_can_read_patients(self, receptionist_user):
        client = auth_client(receptionist_user)
        assert client.get(reverse("patient-list")).status_code == status.HTTP_200_OK

    def test_patient_scoped_patient_list(self, patient_user):
        Patient.objects.create(
            medical_record_number="MRN-RB03",
            first_name="Pat",
            last_name="Ient",
            email="pat@hospital.com",
            phone="555",
            date_of_birth="1990-01-01",
            gender="male",
        )
        Patient.objects.create(
            medical_record_number="MRN-RB04",
            first_name="Other",
            last_name="Person",
            email="other@email.com",
            phone="555",
            date_of_birth="1980-01-01",
            gender="male",
        )
        client = auth_client(patient_user)
        response = client.get(reverse("patient-list"))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1

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
from apps.medical_records.models import MedicalRecord
from apps.patients.models import Patient


@pytest.fixture
def patient(db):
    return Patient.objects.create(
        medical_record_number="MRN-MR01",
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
        license_number="MD-MR01",
        department="Cardiology",
    )


@pytest.mark.django_db
class TestMedicalRecordAPI:
    def test_doctor_creates_record_with_prescription(self, doctor_user, patient, doctor):
        client = auth_client(doctor_user)
        response = client.post(
            reverse("medical-record-list"),
            {
                "patient": str(patient.id),
                "doctor": str(doctor.id),
                "visit_type": "consultation",
                "diagnosis": "Flu",
                "symptoms": "Fever",
                "prescriptions": [
                    {"medication": "Paracetamol", "dosage": "500mg"}
                ],
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data["prescriptions"]) == 1
        assert response.data["prescriptions"][0]["medication"] == "Paracetamol"

    def test_receptionist_cannot_create_record(self, receptionist_user, patient):
        client = auth_client(receptionist_user)
        response = client.post(
            reverse("medical-record-list"),
            {"patient": str(patient.id), "diagnosis": "x"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_patient_sees_only_own_records(
        self, patient_user, patient, doctor, admin_user
    ):
        MedicalRecord.objects.create(patient=patient, doctor=doctor, diagnosis="A")
        other = Patient.objects.create(
            medical_record_number="MRN-MR02",
            first_name="Bob",
            last_name="Other",
            email="other@email.com",
            phone="555",
            date_of_birth="1980-01-01",
            gender="male",
        )
        MedicalRecord.objects.create(patient=other, doctor=doctor, diagnosis="B")

        client = auth_client(patient_user)
        response = client.get(reverse("medical-record-list"))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1

    def test_patient_timeline(self, admin_user, patient, doctor):
        MedicalRecord.objects.create(patient=patient, doctor=doctor, diagnosis="A")
        client = auth_client(admin_user)
        response = client.get(reverse("patient-timeline", args=[patient.id]))
        assert response.status_code == status.HTTP_200_OK
        assert "records" in response.data
        assert "allergies" in response.data
        assert len(response.data["records"]) == 1

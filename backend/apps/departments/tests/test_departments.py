import pytest
from django.urls import reverse
from rest_framework import status

from apps.accounts.tests.conftest import (  # noqa: F401
    admin_user,
    auth_client,
    doctor_user,
)
from apps.departments.models import Department
from apps.doctors.models import Doctor


@pytest.fixture
def department(db):
    return Department.objects.create(name="Cardiology", code="CARD")


@pytest.mark.django_db
class TestDepartmentAPI:
    def test_admin_can_create_department(self, admin_user):
        client = auth_client(admin_user)
        response = client.post(
            reverse("department-list"),
            {"name": "Neurology", "code": "NEURO"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Neurology"

    def test_doctor_cannot_create_department(self, doctor_user):
        client = auth_client(doctor_user)
        response = client.post(
            reverse("department-list"),
            {"name": "Neurology", "code": "NEURO"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_doctor_can_read_departments(self, doctor_user, department):
        client = auth_client(doctor_user)
        response = client.get(reverse("department-list"))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_department_doctors_listing(self, admin_user, department):
        Doctor.objects.create(
            first_name="Robert",
            last_name="Smith",
            email="rs@hospital.com",
            phone="555",
            specialty="Cardiology",
            license_number="MD-DEP01",
            department="Cardiology",
            department_ref=department,
        )
        client = auth_client(admin_user)
        response = client.get(reverse("department-doctors", args=[department.id]))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["specialty"] == "Cardiology"

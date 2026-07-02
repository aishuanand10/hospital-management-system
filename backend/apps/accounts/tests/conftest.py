import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Role

User = get_user_model()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email="admin@hospital.com",
        username="admin",
        password="testpassword123",
        first_name="Test",
        last_name="Admin",
        role=Role.HOSPITAL_ADMIN,
        is_verified=True,
    )


@pytest.fixture
def doctor_user(db):
    return User.objects.create_user(
        email="doc@hospital.com",
        username="doc",
        password="testpassword123",
        first_name="Doc",
        last_name="Tor",
        role=Role.DOCTOR,
        is_verified=True,
    )


@pytest.fixture
def receptionist_user(db):
    return User.objects.create_user(
        email="reception@hospital.com",
        username="reception",
        password="testpassword123",
        first_name="Front",
        last_name="Desk",
        role=Role.RECEPTIONIST,
        is_verified=True,
    )


@pytest.fixture
def patient_user(db):
    return User.objects.create_user(
        email="pat@hospital.com",
        username="pat",
        password="testpassword123",
        first_name="Pat",
        last_name="Ient",
        role=Role.PATIENT,
        is_verified=True,
    )


def auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client

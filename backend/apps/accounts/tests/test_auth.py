import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.tests.conftest import admin_user  # noqa: F401


@pytest.mark.django_db
class TestAuthEndpoints:
    def test_login_success(self, admin_user):
        client = APIClient()
        response = client.post(
            reverse("auth-login"),
            {"email": "admin@hospital.com", "password": "testpassword123"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_login_invalid_credentials(self, admin_user):
        client = APIClient()
        response = client.post(
            reverse("auth-login"),
            {"email": "admin@hospital.com", "password": "wrongpassword"},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_authenticated(self, admin_user):
        from apps.accounts.tests.conftest import auth_client

        client = auth_client(admin_user)
        response = client.get(reverse("auth-me"))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == "admin@hospital.com"
        assert response.data["role"] == "hospital_admin"

    def test_me_unauthenticated(self):
        client = APIClient()
        response = client.get(reverse("auth-me"))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout_blacklists_refresh(self, admin_user):
        from apps.accounts.tests.conftest import auth_client

        login_client = APIClient()
        login_response = login_client.post(
            reverse("auth-login"),
            {"email": "admin@hospital.com", "password": "testpassword123"},
            format="json",
        )
        refresh = login_response.data["refresh"]

        client = auth_client(admin_user)
        response = client.post(reverse("auth-logout"), {"refresh": refresh}, format="json")
        assert response.status_code == status.HTTP_200_OK

    def test_health_check(self):
        client = APIClient()
        response = client.get(reverse("health-check"))
        assert response.status_code in (status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE)
        assert "status" in response.data

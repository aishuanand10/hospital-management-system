from rest_framework import serializers

from .models import Doctor


class DoctorSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    department_name = serializers.CharField(
        source="department_ref.name", read_only=True, default=None
    )

    class Meta:
        model = Doctor
        fields = (
            "id",
            "user",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone",
            "specialty",
            "license_number",
            "department",
            "department_ref",
            "department_name",
            "years_of_experience",
            "consultation_fee",
            "bio",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

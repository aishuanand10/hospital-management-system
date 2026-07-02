from rest_framework import serializers

from .models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    head_doctor_name = serializers.CharField(
        source="head_doctor.full_name", read_only=True, default=None
    )
    doctor_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = (
            "id",
            "name",
            "code",
            "description",
            "location",
            "phone",
            "head_doctor",
            "head_doctor_name",
            "doctor_count",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_doctor_count(self, obj):
        return obj.doctors.count()


class DepartmentDoctorSerializer(serializers.Serializer):
    """Lightweight doctor representation for department listings."""

    id = serializers.UUIDField()
    full_name = serializers.CharField()
    specialty = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField()
    is_active = serializers.BooleanField()

from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from apps.doctors.serializers import DoctorSerializer
from apps.patients.serializers import PatientSerializer

from .models import Appointment, AppointmentStatus, DoctorAvailability

ACTIVE_STATUSES = [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
]


def detect_conflict(doctor, scheduled_at, duration_minutes, exclude_id=None):
    """Return a conflicting appointment for the doctor, or None."""
    if not doctor or not scheduled_at:
        return None
    new_start = scheduled_at
    new_end = scheduled_at + timedelta(minutes=duration_minutes or 30)
    qs = Appointment.objects.filter(
        doctor=doctor, status__in=ACTIVE_STATUSES
    )
    if exclude_id:
        qs = qs.exclude(id=exclude_id)
    for existing in qs:
        existing_start = existing.scheduled_at
        existing_end = existing.scheduled_at + timedelta(
            minutes=existing.duration_minutes or 30
        )
        if new_start < existing_end and existing_start < new_end:
            return existing
    return None


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    doctor_name = serializers.CharField(source="doctor.full_name", read_only=True)
    patient_detail = PatientSerializer(source="patient", read_only=True)
    doctor_detail = DoctorSerializer(source="doctor", read_only=True)

    class Meta:
        model = Appointment
        fields = (
            "id",
            "patient",
            "patient_name",
            "patient_detail",
            "doctor",
            "doctor_name",
            "doctor_detail",
            "scheduled_at",
            "duration_minutes",
            "status",
            "reason",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        doctor = attrs.get("doctor") or getattr(self.instance, "doctor", None)
        scheduled_at = attrs.get("scheduled_at") or getattr(
            self.instance, "scheduled_at", None
        )
        duration = attrs.get("duration_minutes") or getattr(
            self.instance, "duration_minutes", 30
        )
        status = attrs.get("status") or getattr(
            self.instance, "status", AppointmentStatus.SCHEDULED
        )

        if status in ACTIVE_STATUSES and doctor and scheduled_at:
            exclude_id = self.instance.id if self.instance else None
            conflict = detect_conflict(doctor, scheduled_at, duration, exclude_id)
            if conflict:
                raise serializers.ValidationError(
                    {
                        "scheduled_at": (
                            f"This doctor already has an appointment at "
                            f"{conflict.scheduled_at:%Y-%m-%d %H:%M}."
                        )
                    }
                )
        return attrs


class AppointmentListSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    doctor_name = serializers.CharField(source="doctor.full_name", read_only=True)

    class Meta:
        model = Appointment
        fields = (
            "id",
            "patient",
            "patient_name",
            "doctor",
            "doctor_name",
            "scheduled_at",
            "duration_minutes",
            "status",
            "reason",
            "created_at",
        )
        read_only_fields = fields


class RescheduleSerializer(serializers.Serializer):
    scheduled_at = serializers.DateTimeField()
    duration_minutes = serializers.IntegerField(required=False, min_value=5)

    def validate(self, attrs):
        appointment = self.context["appointment"]
        duration = attrs.get("duration_minutes") or appointment.duration_minutes
        conflict = detect_conflict(
            appointment.doctor,
            attrs["scheduled_at"],
            duration,
            exclude_id=appointment.id,
        )
        if conflict:
            raise serializers.ValidationError(
                {
                    "scheduled_at": (
                        f"This doctor already has an appointment at "
                        f"{conflict.scheduled_at:%Y-%m-%d %H:%M}."
                    )
                }
            )
        return attrs


class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source="doctor.full_name", read_only=True)
    weekday_display = serializers.CharField(source="get_weekday_display", read_only=True)

    class Meta:
        model = DoctorAvailability
        fields = (
            "id",
            "doctor",
            "doctor_name",
            "weekday",
            "weekday_display",
            "start_time",
            "end_time",
            "is_available",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate(self, attrs):
        start = attrs.get("start_time") or getattr(self.instance, "start_time", None)
        end = attrs.get("end_time") or getattr(self.instance, "end_time", None)
        if start and end and start >= end:
            raise serializers.ValidationError(
                {"end_time": "End time must be after start time."}
            )
        return attrs

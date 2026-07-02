from django_filters import rest_framework as filters
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import AppointmentAccess, AvailabilityAccess
from apps.core.scoping import scope_to_patient

from .models import Appointment, DoctorAvailability
from .serializers import (
    AppointmentListSerializer,
    AppointmentSerializer,
    DoctorAvailabilitySerializer,
    RescheduleSerializer,
)


class AppointmentFilter(filters.FilterSet):
    status = filters.CharFilter()
    patient = filters.UUIDFilter(field_name="patient__id")
    doctor = filters.UUIDFilter(field_name="doctor__id")
    scheduled_after = filters.DateTimeFilter(field_name="scheduled_at", lookup_expr="gte")
    scheduled_before = filters.DateTimeFilter(field_name="scheduled_at", lookup_expr="lte")

    class Meta:
        model = Appointment
        fields = ["status", "patient", "doctor"]


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.select_related("patient", "doctor").all()
    permission_classes = [AppointmentAccess]
    filterset_class = AppointmentFilter
    search_fields = [
        "reason",
        "notes",
        "patient__first_name",
        "patient__last_name",
        "doctor__last_name",
    ]
    ordering_fields = ["scheduled_at", "status", "created_at"]
    ordering = ["-scheduled_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return AppointmentListSerializer
        return AppointmentSerializer

    def get_queryset(self):
        return scope_to_patient(self.request.user, super().get_queryset())

    @action(detail=True, methods=["post"])
    def reschedule(self, request, pk=None):
        appointment = self.get_object()
        serializer = RescheduleSerializer(
            data=request.data, context={"appointment": appointment}
        )
        serializer.is_valid(raise_exception=True)
        appointment.scheduled_at = serializer.validated_data["scheduled_at"]
        if serializer.validated_data.get("duration_minutes"):
            appointment.duration_minutes = serializer.validated_data["duration_minutes"]
        appointment.status = Appointment._meta.get_field("status").default
        appointment.save()
        return Response(
            AppointmentSerializer(appointment).data, status=status.HTTP_200_OK
        )


class DoctorAvailabilityFilter(filters.FilterSet):
    doctor = filters.UUIDFilter(field_name="doctor__id")
    weekday = filters.NumberFilter()
    is_available = filters.BooleanFilter()

    class Meta:
        model = DoctorAvailability
        fields = ["doctor", "weekday", "is_available"]


class DoctorAvailabilityViewSet(viewsets.ModelViewSet):
    queryset = DoctorAvailability.objects.select_related("doctor").all()
    serializer_class = DoctorAvailabilitySerializer
    permission_classes = [AvailabilityAccess]
    filterset_class = DoctorAvailabilityFilter
    ordering_fields = ["weekday", "start_time"]
    ordering = ["weekday", "start_time"]

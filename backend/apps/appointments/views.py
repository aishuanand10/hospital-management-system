from django_filters import rest_framework as filters
from rest_framework import viewsets

from .models import Appointment
from .serializers import AppointmentListSerializer, AppointmentSerializer


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
    filterset_class = AppointmentFilter
    search_fields = ["reason", "notes", "patient__first_name", "patient__last_name", "doctor__last_name"]
    ordering_fields = ["scheduled_at", "status", "created_at"]
    ordering = ["-scheduled_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return AppointmentListSerializer
        return AppointmentSerializer

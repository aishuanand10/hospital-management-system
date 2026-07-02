from django_filters import rest_framework as filters
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import PATIENT_ROLE, PatientAccess, get_role
from apps.core.scoping import patient_for_user

from .models import Patient
from .serializers import PatientSerializer


class PatientFilter(filters.FilterSet):
    is_active = filters.BooleanFilter()
    gender = filters.CharFilter()
    blood_group = filters.CharFilter()

    class Meta:
        model = Patient
        fields = ["is_active", "gender", "blood_group"]


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [PatientAccess]
    filterset_class = PatientFilter
    search_fields = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "medical_record_number",
    ]
    ordering_fields = ["created_at", "last_name", "first_name", "date_of_birth"]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = super().get_queryset()
        if get_role(self.request.user) == PATIENT_ROLE:
            patient = patient_for_user(self.request.user)
            return queryset.filter(pk=patient.pk) if patient else queryset.none()
        return queryset

    @action(detail=True, methods=["get"])
    def timeline(self, request, pk=None):
        from apps.medical_records.serializers import (
            AllergySerializer,
            MedicalRecordSerializer,
        )

        patient = self.get_object()
        records = (
            patient.medical_records.select_related("doctor")
            .prefetch_related("prescriptions")
            .order_by("-record_date")
        )
        allergies = patient.allergies.all().order_by("-recorded_at")
        return Response(
            {
                "patient": PatientSerializer(patient).data,
                "records": MedicalRecordSerializer(records, many=True).data,
                "allergies": AllergySerializer(allergies, many=True).data,
            }
        )

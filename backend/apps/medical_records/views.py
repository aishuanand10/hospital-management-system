from django_filters import rest_framework as filters
from rest_framework import viewsets

from apps.core.permissions import MedicalRecordAccess
from apps.core.scoping import scope_to_patient

from .models import Allergy, MedicalRecord, Prescription
from .serializers import (
    AllergySerializer,
    MedicalRecordSerializer,
    PrescriptionSerializer,
)


class MedicalRecordFilter(filters.FilterSet):
    patient = filters.UUIDFilter(field_name="patient__id")
    doctor = filters.UUIDFilter(field_name="doctor__id")
    visit_type = filters.CharFilter()

    class Meta:
        model = MedicalRecord
        fields = ["patient", "doctor", "visit_type"]


class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = (
        MedicalRecord.objects.select_related("patient", "doctor")
        .prefetch_related("prescriptions")
        .all()
    )
    serializer_class = MedicalRecordSerializer
    permission_classes = [MedicalRecordAccess]
    filterset_class = MedicalRecordFilter
    search_fields = ["diagnosis", "symptoms", "treatment", "notes", "patient__last_name"]
    ordering_fields = ["record_date", "created_at"]
    ordering = ["-record_date"]

    def get_queryset(self):
        return scope_to_patient(self.request.user, super().get_queryset())


class PrescriptionFilter(filters.FilterSet):
    medical_record = filters.UUIDFilter(field_name="medical_record__id")
    patient = filters.UUIDFilter(field_name="medical_record__patient__id")

    class Meta:
        model = Prescription
        fields = ["medical_record", "patient"]


class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.select_related("medical_record").all()
    serializer_class = PrescriptionSerializer
    permission_classes = [MedicalRecordAccess]
    filterset_class = PrescriptionFilter
    search_fields = ["medication", "instructions"]
    ordering_fields = ["created_at"]
    ordering = ["created_at"]

    def get_queryset(self):
        return scope_to_patient(
            self.request.user, super().get_queryset(), "medical_record__patient"
        )


class AllergyFilter(filters.FilterSet):
    patient = filters.UUIDFilter(field_name="patient__id")
    severity = filters.CharFilter()

    class Meta:
        model = Allergy
        fields = ["patient", "severity"]


class AllergyViewSet(viewsets.ModelViewSet):
    queryset = Allergy.objects.select_related("patient", "recorded_by").all()
    serializer_class = AllergySerializer
    permission_classes = [MedicalRecordAccess]
    filterset_class = AllergyFilter
    search_fields = ["allergen", "reaction", "patient__last_name"]
    ordering_fields = ["recorded_at"]
    ordering = ["-recorded_at"]

    def get_queryset(self):
        return scope_to_patient(self.request.user, super().get_queryset())

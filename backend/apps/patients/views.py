from django_filters import rest_framework as filters
from rest_framework import viewsets

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

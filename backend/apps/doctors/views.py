from django_filters import rest_framework as filters
from rest_framework import viewsets

from .models import Doctor
from .serializers import DoctorSerializer


class DoctorFilter(filters.FilterSet):
    is_active = filters.BooleanFilter()
    specialty = filters.CharFilter(lookup_expr="icontains")
    department = filters.CharFilter(lookup_expr="icontains")

    class Meta:
        model = Doctor
        fields = ["is_active", "specialty", "department"]


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    filterset_class = DoctorFilter
    search_fields = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "specialty",
        "license_number",
        "department",
    ]
    ordering_fields = ["last_name", "first_name", "specialty", "created_at"]
    ordering = ["last_name", "first_name"]

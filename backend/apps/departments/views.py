from django_filters import rest_framework as filters
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import DepartmentAccess

from .models import Department
from .serializers import DepartmentDoctorSerializer, DepartmentSerializer


class DepartmentFilter(filters.FilterSet):
    is_active = filters.BooleanFilter()

    class Meta:
        model = Department
        fields = ["is_active"]


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.select_related("head_doctor").all()
    serializer_class = DepartmentSerializer
    permission_classes = [DepartmentAccess]
    filterset_class = DepartmentFilter
    search_fields = ["name", "code", "description", "location"]
    ordering_fields = ["name", "code", "created_at"]
    ordering = ["name"]

    @action(detail=True, methods=["get"])
    def doctors(self, request, pk=None):
        department = self.get_object()
        doctors = department.doctors.all().order_by("last_name", "first_name")
        data = [
            {
                "id": d.id,
                "full_name": d.full_name,
                "specialty": d.specialty,
                "email": d.email,
                "phone": d.phone,
                "is_active": d.is_active,
            }
            for d in doctors
        ]
        serializer = DepartmentDoctorSerializer(data, many=True)
        return Response(serializer.data)

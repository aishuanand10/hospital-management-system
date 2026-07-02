from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AllergyViewSet, MedicalRecordViewSet, PrescriptionViewSet

router = DefaultRouter()
router.register("medical-records", MedicalRecordViewSet, basename="medical-record")
router.register("prescriptions", PrescriptionViewSet, basename="prescription")
router.register("allergies", AllergyViewSet, basename="allergy")

urlpatterns = [
    path("", include(router.urls)),
]

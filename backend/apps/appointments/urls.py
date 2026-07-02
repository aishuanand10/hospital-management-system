from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AppointmentViewSet, DoctorAvailabilityViewSet

router = DefaultRouter()
router.register("appointments", AppointmentViewSet, basename="appointment")
router.register("availabilities", DoctorAvailabilityViewSet, basename="availability")

urlpatterns = [
    path("", include(router.urls)),
]

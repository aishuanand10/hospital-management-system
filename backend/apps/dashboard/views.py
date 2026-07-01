from datetime import timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.appointments.models import Appointment, AppointmentStatus
from apps.doctors.models import Doctor
from apps.patients.models import Patient


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        tomorrow = today + timedelta(days=1)

        appointments_today = Appointment.objects.filter(
            scheduled_at__date=today
        ).exclude(status=AppointmentStatus.CANCELLED)

        return Response(
            {
                "total_patients": Patient.objects.filter(is_active=True).count(),
                "total_doctors": Doctor.objects.filter(is_active=True).count(),
                "total_appointments": Appointment.objects.count(),
                "appointments_today": appointments_today.count(),
                "appointments_upcoming": Appointment.objects.filter(
                    scheduled_at__gte=timezone.now(),
                    status__in=[
                        AppointmentStatus.SCHEDULED,
                        AppointmentStatus.CONFIRMED,
                    ],
                ).count(),
                "appointments_pending": Appointment.objects.filter(
                    status__in=[
                        AppointmentStatus.SCHEDULED,
                        AppointmentStatus.CONFIRMED,
                    ],
                ).count(),
                "appointments_completed": Appointment.objects.filter(
                    status=AppointmentStatus.COMPLETED
                ).count(),
                "appointments_by_status": dict(
                    Appointment.objects.values("status")
                    .annotate(count=Count("id"))
                    .values_list("status", "count")
                ),
            }
        )


class RecentActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit = min(int(request.query_params.get("limit", 10)), 50)

        recent_appointments = (
            Appointment.objects.select_related("patient", "doctor")
            .order_by("-created_at")[:limit]
        )
        recent_patients = Patient.objects.order_by("-created_at")[:limit]

        activities = []

        for appt in recent_appointments:
            activities.append(
                {
                    "type": "appointment",
                    "id": str(appt.id),
                    "title": f"Appointment: {appt.patient.full_name} with {appt.doctor.full_name}",
                    "description": appt.reason,
                    "status": appt.status,
                    "timestamp": appt.created_at,
                }
            )

        for patient in recent_patients:
            activities.append(
                {
                    "type": "patient",
                    "id": str(patient.id),
                    "title": f"New patient: {patient.full_name}",
                    "description": patient.medical_record_number,
                    "status": "active" if patient.is_active else "inactive",
                    "timestamp": patient.created_at,
                }
            )

        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        activities = activities[:limit]

        for item in activities:
            item["timestamp"] = item["timestamp"].isoformat()

        return Response({"results": activities})

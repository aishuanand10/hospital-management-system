from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.appointments.models import Appointment, AppointmentStatus
from apps.appointments.serializers import AppointmentListSerializer
from apps.departments.models import Department
from apps.doctors.models import Doctor
from apps.medical_records.models import MedicalRecord
from apps.patients.models import Patient

ACTIVE = [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()

        appointments_today = Appointment.objects.filter(
            scheduled_at__date=today
        ).exclude(status=AppointmentStatus.CANCELLED)

        return Response(
            {
                "total_patients": Patient.objects.filter(is_active=True).count(),
                "total_doctors": Doctor.objects.filter(is_active=True).count(),
                "total_departments": Department.objects.filter(is_active=True).count(),
                "total_appointments": Appointment.objects.count(),
                "total_medical_records": MedicalRecord.objects.count(),
                "appointments_today": appointments_today.count(),
                "appointments_upcoming": Appointment.objects.filter(
                    scheduled_at__gte=timezone.now(), status__in=ACTIVE
                ).count(),
                "appointments_pending": Appointment.objects.filter(
                    status__in=ACTIVE
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

        recent_appointments = Appointment.objects.select_related(
            "patient", "doctor"
        ).order_by("-created_at")[:limit]
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


class RecentAppointmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit = min(int(request.query_params.get("limit", 10)), 50)
        appointments = Appointment.objects.select_related("patient", "doctor").order_by(
            "-scheduled_at"
        )[:limit]
        return Response(
            {"results": AppointmentListSerializer(appointments, many=True).data}
        )


class DepartmentStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        departments = Department.objects.filter(is_active=True).order_by("name")
        results = []
        for dept in departments:
            doctor_ids = list(dept.doctors.values_list("id", flat=True))
            appointment_count = Appointment.objects.filter(
                doctor__id__in=doctor_ids
            ).count()
            results.append(
                {
                    "id": str(dept.id),
                    "name": dept.name,
                    "code": dept.code,
                    "doctor_count": len(doctor_ids),
                    "appointment_count": appointment_count,
                }
            )
        return Response({"results": results})


class DoctorWorkloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        now = timezone.now()
        doctors = Doctor.objects.filter(is_active=True).annotate(
            total_appointments=Count("appointments"),
            today_appointments=Count(
                "appointments",
                filter=Q(appointments__scheduled_at__date=today)
                & ~Q(appointments__status=AppointmentStatus.CANCELLED),
            ),
            upcoming_appointments=Count(
                "appointments",
                filter=Q(appointments__scheduled_at__gte=now)
                & Q(appointments__status__in=ACTIVE),
            ),
        )
        results = [
            {
                "id": str(d.id),
                "name": d.full_name,
                "specialty": d.specialty,
                "total_appointments": d.total_appointments,
                "today_appointments": d.today_appointments,
                "upcoming_appointments": d.upcoming_appointments,
            }
            for d in doctors
        ]
        results.sort(key=lambda x: x["upcoming_appointments"], reverse=True)
        return Response({"results": results})


class PatientActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit = min(int(request.query_params.get("limit", 10)), 50)
        patients = Patient.objects.annotate(
            appointment_count=Count("appointments", distinct=True),
            record_count=Count("medical_records", distinct=True),
        ).order_by("-created_at")[:limit]
        results = [
            {
                "id": str(p.id),
                "name": p.full_name,
                "medical_record_number": p.medical_record_number,
                "appointment_count": p.appointment_count,
                "record_count": p.record_count,
                "created_at": p.created_at.isoformat(),
            }
            for p in patients
        ]
        return Response({"results": results})

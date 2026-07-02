from datetime import time, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.appointments.models import DoctorAvailability, Weekday
from apps.departments.models import Department
from apps.doctors.models import Doctor
from apps.medical_records.models import Allergy, MedicalRecord, Prescription
from apps.patients.models import Patient

User = get_user_model()


class Command(BaseCommand):
    help = "Seed Milestone 2 data: RBAC users, departments, availability, records."

    def handle(self, *args, **options):
        self._seed_users()
        self._seed_departments()
        self._seed_availability()
        self._seed_medical_records()
        self.stdout.write(self.style.SUCCESS("Milestone 2 seed complete."))

    def _seed_users(self):
        role_users = [
            ("doctor@hospital.com", "doctorpass123", "doctor", "Robert", "Smith"),
            (
                "receptionist@hospital.com",
                "receptionpass123",
                "receptionist",
                "Rita",
                "Reyes",
            ),
            ("patient@hospital.com", "patientpass123", "patient", "Alice", "Johnson"),
        ]
        for email, password, role, first, last in role_users:
            if User.objects.filter(email=email).exists():
                continue
            User.objects.create_user(
                email=email,
                username=email.split("@")[0],
                password=password,
                first_name=first,
                last_name=last,
                role=role,
                is_verified=True,
            )
            self.stdout.write(f"Created {role} user: {email}")

        # Link doctor user to the first doctor profile (matched by email).
        doctor_user = User.objects.filter(email="doctor@hospital.com").first()
        doctor_profile = Doctor.objects.filter(email="dr.smith@hospital.com").first()
        if doctor_user and doctor_profile and doctor_profile.user_id is None:
            doctor_profile.user = doctor_user
            doctor_profile.save(update_fields=["user"])

        # Align the patient user's email with an existing patient for scoping demos.
        patient_user = User.objects.filter(email="patient@hospital.com").first()
        patient = Patient.objects.order_by("created_at").first()
        if patient_user and patient and patient.email != patient_user.email:
            patient.email = patient_user.email
            patient.save(update_fields=["email"])

    def _seed_departments(self):
        if Department.objects.exists():
            return
        specs = [
            ("Cardiology", "CARD", "Heart and vascular care", "Cardiology"),
            ("Pediatrics", "PEDS", "Child and adolescent health", "Pediatrics"),
            ("Orthopedics", "ORTH", "Bones, joints, and muscles", "Orthopedics"),
        ]
        for name, code, desc, doctor_specialty in specs:
            dept = Department.objects.create(
                name=name, code=code, description=desc, location=f"{name} Wing"
            )
            doctors = Doctor.objects.filter(department=doctor_specialty)
            for doctor in doctors:
                doctor.department_ref = dept
                doctor.save(update_fields=["department_ref"])
            head = doctors.first()
            if head:
                dept.head_doctor = head
                dept.save(update_fields=["head_doctor"])
            self.stdout.write(f"Created department: {name}")

    def _seed_availability(self):
        if DoctorAvailability.objects.exists():
            return
        weekdays = [Weekday.MONDAY, Weekday.WEDNESDAY, Weekday.FRIDAY]
        for doctor in Doctor.objects.all():
            for weekday in weekdays:
                DoctorAvailability.objects.get_or_create(
                    doctor=doctor,
                    weekday=weekday,
                    start_time=time(9, 0),
                    end_time=time(17, 0),
                    defaults={"is_available": True},
                )
        self.stdout.write("Created doctor availability windows.")

    def _seed_medical_records(self):
        if MedicalRecord.objects.exists():
            return
        patient = Patient.objects.order_by("created_at").first()
        doctor = Doctor.objects.filter(email="dr.smith@hospital.com").first()
        if not patient or not doctor:
            return

        record = MedicalRecord.objects.create(
            patient=patient,
            doctor=doctor,
            record_date=timezone.now() - timedelta(days=10),
            visit_type="consultation",
            symptoms="Chest discomfort, mild fatigue",
            diagnosis="Stable angina",
            treatment="Lifestyle changes, prescribed medication",
            notes="Follow up in 3 months.",
        )
        Prescription.objects.create(
            medical_record=record,
            medication="Atorvastatin",
            dosage="20mg",
            frequency="Once daily",
            duration="90 days",
            instructions="Take at night.",
        )
        Allergy.objects.create(
            patient=patient,
            allergen="Penicillin",
            reaction="Rash",
            severity="moderate",
            recorded_by=doctor,
        )
        self.stdout.write("Created sample medical record, prescription, and allergy.")

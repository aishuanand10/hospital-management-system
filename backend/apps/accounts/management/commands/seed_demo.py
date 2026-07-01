from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.appointments.models import Appointment, AppointmentStatus
from apps.doctors.models import Doctor
from apps.patients.models import Patient


class Command(BaseCommand):
    help = "Seed demo patients, doctors, and appointments for Milestone 1."

    def handle(self, *args, **options):
        if Patient.objects.exists():
            self.stdout.write("Demo data already exists, skipping.")
            return

        patients = [
            Patient(
                medical_record_number="MRN-10001",
                first_name="Alice",
                last_name="Johnson",
                email="alice.johnson@email.com",
                phone="555-0101",
                date_of_birth="1985-03-15",
                gender="female",
                blood_group="A+",
                address="123 Oak Street, Springfield",
                emergency_contact_name="Bob Johnson",
                emergency_contact_phone="555-0102",
            ),
            Patient(
                medical_record_number="MRN-10002",
                first_name="Michael",
                last_name="Chen",
                email="michael.chen@email.com",
                phone="555-0201",
                date_of_birth="1990-07-22",
                gender="male",
                blood_group="O+",
                address="456 Maple Ave, Springfield",
                emergency_contact_name="Lisa Chen",
                emergency_contact_phone="555-0202",
            ),
            Patient(
                medical_record_number="MRN-10003",
                first_name="Sarah",
                last_name="Williams",
                email="sarah.williams@email.com",
                phone="555-0301",
                date_of_birth="1978-11-08",
                gender="female",
                blood_group="B+",
                address="789 Pine Road, Springfield",
            ),
            Patient(
                medical_record_number="MRN-10004",
                first_name="James",
                last_name="Brown",
                email="james.brown@email.com",
                phone="555-0401",
                date_of_birth="2000-01-30",
                gender="male",
                blood_group="AB+",
                address="321 Elm Street, Springfield",
            ),
            Patient(
                medical_record_number="MRN-10005",
                first_name="Emily",
                last_name="Davis",
                email="emily.davis@email.com",
                phone="555-0501",
                date_of_birth="1995-05-12",
                gender="female",
                blood_group="O-",
                address="654 Cedar Lane, Springfield",
            ),
        ]
        Patient.objects.bulk_create(patients)
        patients = list(Patient.objects.all())

        doctors = [
            Doctor(
                first_name="Robert",
                last_name="Smith",
                email="dr.smith@hospital.com",
                phone="555-1001",
                specialty="Cardiology",
                license_number="MD-10001",
                department="Cardiology",
                years_of_experience=15,
                consultation_fee=150.00,
                bio="Board-certified cardiologist specializing in heart disease prevention.",
            ),
            Doctor(
                first_name="Maria",
                last_name="Garcia",
                email="dr.garcia@hospital.com",
                phone="555-1002",
                specialty="Pediatrics",
                license_number="MD-10002",
                department="Pediatrics",
                years_of_experience=10,
                consultation_fee=120.00,
                bio="Pediatrician with expertise in child development and wellness.",
            ),
            Doctor(
                first_name="David",
                last_name="Lee",
                email="dr.lee@hospital.com",
                phone="555-1003",
                specialty="Orthopedics",
                license_number="MD-10003",
                department="Orthopedics",
                years_of_experience=12,
                consultation_fee=175.00,
                bio="Orthopedic surgeon focused on sports injuries and joint care.",
            ),
        ]
        Doctor.objects.bulk_create(doctors)
        doctors = list(Doctor.objects.all())

        now = timezone.now()
        appointments = [
            Appointment(
                patient=patients[0],
                doctor=doctors[0],
                scheduled_at=now + timedelta(days=1, hours=2),
                status=AppointmentStatus.SCHEDULED,
                reason="Annual cardiac checkup",
            ),
            Appointment(
                patient=patients[1],
                doctor=doctors[1],
                scheduled_at=now + timedelta(days=2),
                status=AppointmentStatus.CONFIRMED,
                reason="Pediatric wellness visit",
            ),
            Appointment(
                patient=patients[2],
                doctor=doctors[2],
                scheduled_at=now - timedelta(days=1),
                status=AppointmentStatus.COMPLETED,
                reason="Knee pain evaluation",
                notes="Prescribed physical therapy.",
            ),
            Appointment(
                patient=patients[3],
                doctor=doctors[0],
                scheduled_at=now + timedelta(hours=4),
                status=AppointmentStatus.SCHEDULED,
                reason="Follow-up consultation",
            ),
            Appointment(
                patient=patients[4],
                doctor=doctors[1],
                scheduled_at=now - timedelta(days=3),
                status=AppointmentStatus.CANCELLED,
                reason="Vaccination appointment",
                notes="Patient rescheduled.",
            ),
        ]
        Appointment.objects.bulk_create(appointments)

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {len(patients)} patients, {len(doctors)} doctors, "
                f"and {len(appointments)} appointments."
            )
        )

import uuid

from django.db import models
from django.utils import timezone


class VisitType(models.TextChoices):
    CONSULTATION = "consultation", "Consultation"
    FOLLOW_UP = "follow_up", "Follow-up"
    EMERGENCY = "emergency", "Emergency"
    LAB = "lab", "Lab / Diagnostics"
    OTHER = "other", "Other"


class AllergySeverity(models.TextChoices):
    MILD = "mild", "Mild"
    MODERATE = "moderate", "Moderate"
    SEVERE = "severe", "Severe"


class MedicalRecord(models.Model):
    """A single clinical encounter in a patient's medical history timeline."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(
        "patients.Patient", on_delete=models.CASCADE, related_name="medical_records"
    )
    doctor = models.ForeignKey(
        "doctors.Doctor",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="medical_records",
    )
    appointment = models.ForeignKey(
        "appointments.Appointment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="medical_records",
    )
    record_date = models.DateTimeField(default=timezone.now)
    visit_type = models.CharField(
        max_length=20, choices=VisitType.choices, default=VisitType.CONSULTATION
    )
    symptoms = models.TextField(blank=True)
    diagnosis = models.TextField(blank=True)
    treatment = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "medical_records"
        ordering = ["-record_date"]

    def __str__(self):
        return f"Record for {self.patient} on {self.record_date:%Y-%m-%d}"


class Prescription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medical_record = models.ForeignKey(
        MedicalRecord, on_delete=models.CASCADE, related_name="prescriptions"
    )
    medication = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100, blank=True)
    frequency = models.CharField(max_length=100, blank=True)
    duration = models.CharField(max_length=100, blank=True)
    instructions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "prescriptions"
        ordering = ["created_at"]

    def __str__(self):
        return self.medication


class Allergy(models.Model):
    """A patient-level allergy record (ongoing, not tied to a single visit)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(
        "patients.Patient", on_delete=models.CASCADE, related_name="allergies"
    )
    allergen = models.CharField(max_length=200)
    reaction = models.CharField(max_length=255, blank=True)
    severity = models.CharField(
        max_length=20, choices=AllergySeverity.choices, default=AllergySeverity.MILD
    )
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(
        "doctors.Doctor",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recorded_allergies",
    )
    recorded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "allergies"
        ordering = ["-recorded_at"]
        verbose_name_plural = "allergies"

    def __str__(self):
        return f"{self.allergen} ({self.patient})"

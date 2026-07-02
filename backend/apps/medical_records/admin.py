from django.contrib import admin

from .models import Allergy, MedicalRecord, Prescription


class PrescriptionInline(admin.TabularInline):
    model = Prescription
    extra = 0


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ("patient", "doctor", "visit_type", "record_date")
    list_filter = ("visit_type", "record_date")
    search_fields = ("patient__last_name", "diagnosis", "symptoms")
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [PrescriptionInline]


@admin.register(Allergy)
class AllergyAdmin(admin.ModelAdmin):
    list_display = ("allergen", "patient", "severity", "recorded_at")
    list_filter = ("severity",)
    search_fields = ("allergen", "patient__last_name")
    readonly_fields = ("id",)


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ("medication", "medical_record", "dosage", "frequency")
    search_fields = ("medication",)
    readonly_fields = ("id", "created_at")

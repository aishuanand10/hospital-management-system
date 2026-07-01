from django.contrib import admin

from .models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = (
        "medical_record_number",
        "first_name",
        "last_name",
        "phone",
        "gender",
        "is_active",
        "created_at",
    )
    list_filter = ("is_active", "gender", "blood_group")
    search_fields = ("first_name", "last_name", "medical_record_number", "email", "phone")
    readonly_fields = ("id", "created_at", "updated_at")

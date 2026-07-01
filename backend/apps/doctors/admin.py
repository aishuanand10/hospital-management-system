from django.contrib import admin

from .models import Doctor


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = (
        "first_name",
        "last_name",
        "specialty",
        "department",
        "license_number",
        "is_active",
    )
    list_filter = ("is_active", "specialty", "department")
    search_fields = ("first_name", "last_name", "email", "license_number", "specialty")
    readonly_fields = ("id", "created_at", "updated_at")

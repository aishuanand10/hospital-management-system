from django.contrib import admin

from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        "patient",
        "doctor",
        "scheduled_at",
        "status",
        "reason",
    )
    list_filter = ("status", "scheduled_at")
    search_fields = (
        "patient__first_name",
        "patient__last_name",
        "doctor__first_name",
        "doctor__last_name",
        "reason",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    autocomplete_fields = ("patient", "doctor")

from django.contrib import admin

from .models import Department


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "head_doctor", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "code", "location")
    readonly_fields = ("id", "created_at", "updated_at")

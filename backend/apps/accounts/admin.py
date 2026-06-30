from django.contrib import admin

from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "username", "role", "is_active", "is_verified", "date_joined")
    list_filter = ("role", "is_active", "is_verified")
    search_fields = ("email", "username", "first_name", "last_name")
    ordering = ("-date_joined",)

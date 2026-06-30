from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Create the default admin superuser for local development."

    def handle(self, *args, **options):
        email = "admin@hospital.com"
        if User.objects.filter(email=email).exists():
            self.stdout.write("Admin user already exists, skipping.")
            return

        User.objects.create_superuser(
            email=email,
            username="admin",
            password="adminpassword123",
            first_name="System",
            last_name="Admin",
            role="super_admin",
            is_verified=True,
        )
        self.stdout.write(
            self.style.SUCCESS(f"Created admin user: {email} / adminpassword123")
        )

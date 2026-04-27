"""
python manage.py create_admin
"""
from django.core.management.base import BaseCommand
from apps.users.models import User


class Command(BaseCommand):
    help = "Default admin yaratadi (marjona / 18061806)"

    def handle(self, *args, **options):
        if User.objects.filter(username='marjona').exists():
            self.stdout.write(self.style.WARNING("Admin 'marjona' allaqachon mavjud."))
            return

        admin = User.objects.create_superuser(
            username='marjona',
            password='18061806',
            firstname='Admin',
            lastname='User',
            phone='998901234599',
        )
        admin.generate_qr_token()
        self.stdout.write(self.style.SUCCESS(
            "Admin yaratildi!\n"
            "  Username : marjona\n"
            "  Parol    : 18061806\n"
            "  ⚠️  Parolni o'zgartirishni unutmang!"
        ))

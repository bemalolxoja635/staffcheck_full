"""
python manage.py create_admin
"""
from django.core.management.base import BaseCommand
from apps.users.models import User


class Command(BaseCommand):
    help = "Default admin yaratadi (marjona / 18061806)"

    def handle(self, *args, **options):
        if not User.objects.filter(username='marjona').exists():
            admin1 = User.objects.create_superuser(
                username='marjona',
                password='18061806',
                firstname='Admin',
                lastname='User',
                phone='998901234599',
            )
            admin1.generate_qr_token()

        if not User.objects.filter(username='admin').exists():
            admin2 = User.objects.create_superuser(
                username='admin',
                password='admin123',
                firstname='Asosiy',
                lastname='Admin',
                phone='998900000000',
            )
            admin2.generate_qr_token()

        self.stdout.write(self.style.SUCCESS(
            "Adminlar ishlashga tayyor!\n"
            "  Username : admin\n"
            "  Parol    : admin123\n"
            "  ==== YOKI ====\n"
            "  Username : marjona\n"
            "  Parol    : 18061806\n"
        ))

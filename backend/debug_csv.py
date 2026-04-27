import os
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'staffcheck.settings')
django.setup()

from apps.attendance.models import Attendance
from apps.users.models import User
import csv

qs = Attendance.objects.all()[:1]
for att in qs:
    print(f"DEBUG: '{att.user.firstname}' | '{att.user.lastname}' | '{att.date.strftime('%d.%m.%Y')}'")

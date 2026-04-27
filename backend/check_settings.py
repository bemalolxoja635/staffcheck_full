import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'staffcheck.settings')
django.setup()

from apps.settings_app.models import Setting
print([(s.key, s.value) for s in Setting.objects.all()])

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'staffcheck.settings')
django.setup()

from apps.settings_app.models import Setting
try:
    Setting.set_value('admin_telegram_id', '8493106393')
    print("Success")
except Exception as e:
    print(f"Error: {e}")

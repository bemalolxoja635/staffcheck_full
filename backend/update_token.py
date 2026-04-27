import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'staffcheck.settings')
django.setup()

from apps.settings_app.models import Setting
Setting.set_value('telegram_bot_token', '8224034084:AAGWIDEIARGrL5lyPc8TMpjOroKvwSxifLk')
print("Bot token updated in DB")

import json
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.conf import settings
from apps.users.models import User
from apps.users.utils import send_telegram

@csrf_exempt
def telegram_webhook(request):
    if request.method != 'POST':
        return HttpResponse("OK")
    
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return HttpResponse("OK")

    message = data.get('message')
    if not message:
        return HttpResponse("OK")

    chat_id = str(message.get('chat', {}).get('id'))
    text = message.get('text', '')
    contact = message.get('contact')

    # 1. Handle Contact (Phone number sharing)
    if contact:
        phone = contact.get('phone_number', '').replace('+', '')
        try:
            # Oxirgi 9 ta raqamni tekshirish (uzb format uchun)
            user = User.objects.filter(phone__icontains=phone[-9:]).first()
            if user:
                user.telegram_id = chat_id
                user.save(update_fields=['telegram_id'])
                send_telegram(chat_id, f"✅ <b>Tabriklaymiz!</b>\n\nAkkauntingiz ({user.get_full_name()}) muvaffaqiyatli bog'landi.")
            else:
                send_telegram(chat_id, "❌ Ushbu raqam tizimda topilmadi. Admin bilan bog'laning.")
        except Exception as e:
            print(f"Bot link error: {e}")
        return HttpResponse("OK")

    # 2. Handle /start
    if text.startswith('/start'):
        # Token bilan kelgan bo'lsa (Deep linking: /start <qr_token>)
        parts = text.split()
        if len(parts) > 1:
            token = parts[1]
            try:
                user = User.objects.filter(qr_token=token).first()
                if user:
                    user.telegram_id = chat_id
                    user.save(update_fields=['telegram_id'])
                    send_telegram(chat_id, f"✅ <b>Assalomu alaykum, {user.firstname}!</b>\n\nAkkauntingiz muvaffaqiyatli bog'landi. Endi davomat ma'lumotlarini shu yerda olasiz.")
                    return HttpResponse("OK")
                else:
                    send_telegram(chat_id, "❌ Noto'g'ri yoki eskirgan xavfsizlik kaliti (token).")
            except Exception as e:
                print(f"Deep link error: {e}")

        # Oddiy start - raqamni so'rash
        send_telegram_with_contact_request(chat_id, "Assalomu alaykum! StaffCheck botiga xush kelibsiz.\n\nAkkauntingizni bog'lash uchun pastdagi tugmani bosing yoki tizimdagi QR-kod ostidagi 'Botga ulanish' havolasidan foydalaning:")

    return HttpResponse("OK")

def send_telegram_with_contact_request(chat_id, text):
    import requests
    from apps.settings_app.models import Setting
    token = Setting.get_value('telegram_bot_token', '') or getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        'chat_id': chat_id,
        'text': text,
        'reply_markup': {
            'keyboard': [[{
                'text': "📱 Raqamni yuborish",
                'request_contact': True
            }]],
            'one_time_keyboard': True,
            'resize_keyboard': True
        }
    }
    requests.post(url, json=payload, timeout=10)

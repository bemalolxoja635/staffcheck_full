import requests
from django.conf import settings


def get_client_ip(request) -> str:
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def send_telegram(chat_id: str, message: str) -> bool:
    """Telegram Bot orqali xabar yuborish"""
    if not chat_id:
        return False
    token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
    if not token:
        return False
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        resp = requests.post(url, json={
            'chat_id': chat_id,
            'text': message,
            'parse_mode': 'HTML',
        }, timeout=5)
        return resp.status_code == 200
    except Exception:
        return False

import math
import requests
from django.conf import settings


def get_client_ip(request) -> str:
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def calculate_distance(lat1, lon1, lat2, lon2) -> float:
    """Ikki nuqta orasidagi masofani hisoblaydi (metrda)"""
    R = 6371000  # Yer radiusi (metr)
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


import threading
import logging
from apps.settings_app.models import Setting

logger = logging.getLogger(__name__)

def send_telegram(chat_id: str, message: str) -> bool:
    """Telegram Bot orqali xabar yuborish (Async, Settings-dan o'qiydi, Xatolar loglanadi)"""
    if not chat_id:
        return False
    
    def _send():
        # 1. Admin paneldagi sozlamadan o'qiymiz, agar bo'sh bo'lsa settings.py dan
        token = Setting.get_value('telegram_bot_token', '') or getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
        
        if not token:
            logger.warning("TELEGRAM_BOT_TOKEN topilmadi (Settings yoki .env da)")
            return
            
        try:
            url = f"https://api.telegram.org/bot{token}/sendMessage"
            resp = requests.post(url, json={
                'chat_id': chat_id,
                'text': message,
                'parse_mode': 'HTML',
            }, timeout=10)
            
            if resp.status_code != 200:
                logger.error(f"Telegram API xatosi: {resp.status_code} - {resp.text}")
                
        except Exception as e:
            logger.error(f"Telegram yuborishda kutilmagan xato: {e}")

    # Thread - response bloklanmasligi uchun
    threading.Thread(target=_send, daemon=True).start()
    return True

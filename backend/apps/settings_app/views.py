from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.users.permissions import IsAdmin
from .models import Setting


DEFAULT_SETTINGS = {
    'start_time':              '09:00:00',
    'end_time':                '18:00:00',
    'late_threshold_minutes':  '15',
    'company_name':            'StaffCheck',
    'telegram_bot_token':      '',
    'admin_telegram_id':       '',
}


class SettingsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        """Barcha sozlamalarni qaytaradi"""
        settings_qs = Setting.objects.all()
        data = {s.key: s.value for s in settings_qs}

        # Default qiymatlar bilan to'ldirish
        for key, val in DEFAULT_SETTINGS.items():
            if key not in data:
                data[key] = val

        # Token ni yashir
        if 'telegram_bot_token' in data and data['telegram_bot_token']:
            data['telegram_bot_token'] = '***' + data['telegram_bot_token'][-6:]

        return Response(data)

    def post(self, request):
        """Sozlamalarni yangilaydi"""
        allowed_keys = set(DEFAULT_SETTINGS.keys())
        updated = []

        for key, value in request.data.items():
            if key not in allowed_keys:
                continue
            # Token ni '***' bilan kelsa saqlamaylik
            if key == 'telegram_bot_token' and str(value).startswith('***'):
                continue
            Setting.set_value(key, str(value))
            updated.append(key)

        return Response({
            'message': f"{len(updated)} ta sozlama saqlandi.",
            'updated': updated,
        })


class PublicSettingsView(APIView):
    """Faqat frontend uchun kerakli sozlamalar (token yo'q)"""
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        data = {
            'start_time':             Setting.get_value('start_time', '09:00:00'),
            'end_time':               Setting.get_value('end_time', '18:00:00'),
            'late_threshold_minutes': Setting.get_value('late_threshold_minutes', '15'),
            'company_name':           Setting.get_value('company_name', 'StaffCheck'),
        }
        return Response(data)

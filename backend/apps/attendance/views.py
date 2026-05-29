from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.signing import TimestampSigner, SignatureExpired, BadSignature
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

from drf_spectacular.utils import extend_schema, OpenApiParameter
from apps.settings_app.models import Setting
from apps.users.models import User, ActionLog
from apps.users.utils import send_telegram, get_client_ip
from .models import Attendance
from .serializers import AttendanceSerializer

signer = TimestampSigner()


# ── Helper ────────────────────────────────────────────────────────────────────
def get_work_settings():
    """Ish vaqti sozlamalarini DB dan oladi"""
    start     = Setting.get_value('start_time',              '09:00:00')
    late_min  = int(Setting.get_value('late_threshold_minutes', '15'))
    return start, late_min


def determine_status(now_time, start_time_str: str, late_minutes: int) -> str:
    """Kelish vaqtini tekshirib on_time/late qaytaradi"""
    start_dt     = datetime.strptime(start_time_str, '%H:%M:%S')
    threshold_dt = (start_dt + timedelta(minutes=late_minutes)).time()
    return 'late' if now_time > threshold_dt else 'on_time'


# ── FaceID Attendance ─────────────────────────────────────────────────────────
class AttendanceChallengeView(APIView):
    """
    Frontend uchun vaqtinchalik imzolangan token generatsiya qiladi.
    Bu token 1 daqiqa amal qiladi.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="FaceID uchun challenge token olish",
        description="Har bir FaceID urinishi uchun vaqtinchalik (1 daqiqa) token generatsiya qiladi.",
        responses={200: {"type": "object", "properties": {"challenge": {"type": "string"}}}}
    )
    @method_decorator(ratelimit(key='ip', rate='20/m', method='GET', block=True), name='get')
    def get(self, request):
        token = signer.sign('face-id-session')
        return Response({'challenge': token})


@method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True), name='post')
class FaceAttendanceView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="FaceID orqali davomat",
        description="Yuz tanilgandan so'ng xodimning ID si va challenge tokeni bilan yuboriladi.",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "integer"},
                    "challenge": {"type": "string"},
                    "lat": {"type": "number"},
                    "lng": {"type": "number"}
                },
                "required": ["user_id", "challenge", "lat", "lng"]
            }
        }
    )
    def post(self, request):
        # 1. Token (challenge) tekshiruvi
        challenge = request.data.get('challenge')
        if not challenge:
            return Response({'status': 'error', 'message': 'Xavfsizlik tokeni (challenge) yo\'q'}, status=403)
        
        try:
            # 60 soniya ichida ishlatilishi kerak
            signer.unsign(challenge, max_age=60)
        except SignatureExpired:
            ActionLog.objects.create(action='face_checkin_fail', details='Token expired', ip_address=get_client_ip(request))
            return Response({'status': 'error', 'message': 'Token vaqti tugagan, iltimos qaytadan urinib ko\'ring'}, status=403)
        except BadSignature:
            ActionLog.objects.create(action='face_checkin_fail', details='Bad Signature', ip_address=get_client_ip(request))
            return Response({'status': 'error', 'message': 'Xavfsizlik xatosi (Bad Token)'}, status=403)

        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'status': 'error', 'message': 'user_id kerak'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(id=user_id, status='active')
        except User.DoesNotExist:
            ActionLog.objects.create(action='face_checkin_fail', details=f'User not found: {user_id}', ip_address=get_client_ip(request))
            return Response(
                {'status': 'error', 'message': 'Xodim topilmadi yoki bloklangan'},
                status=status.HTTP_404_NOT_FOUND,
            )

        today    = timezone.now().date()
        now_time = timezone.now().time()
        start_str, late_min = get_work_settings()

        # Geolocation tekshiruvi
        lat = request.data.get('lat')
        lng = request.data.get('lng')

        if not lat or not lng:
            return Response(
                {'status': 'error', 'message': 'Geolokatsiya ma\'lumotlari kerak.'},
                status=400
            )
        
        from django.conf import settings
        from apps.users.utils import calculate_distance
        
        dist = calculate_distance(float(lat), float(lng), settings.OFFICE_LAT, settings.OFFICE_LNG)
        
        if dist > settings.ALLOWED_DISTANCE_METERS:
            if user.telegram_id:
                send_telegram(
                    user.telegram_id,
                    f"🛑 <b>XATO! Masofa uzoq.</b>\n\n"
                    f"Siz ish joyidan {int(dist)} metr uzoqdasiz.\n"
                    f"Ishga kirish uchun 500 metr masofada bo'lishingiz shart."
                )
            ActionLog.objects.create(
                user=user, 
                action='face_checkin_fail', 
                details=f'Masofa uzoq ({int(dist)}m). IP: {get_client_ip(request)}', 
                ip_address=get_client_ip(request)
            )
            return Response({
                'status': 'error', 
                'message': f'Siz ish joyidan juda uzoqdasiz ({int(dist)}m). 500m radiusda bo\'lishingiz kerak.'
            }, status=403)

        attendance, created = Attendance.objects.get_or_create(
            user=user, date=today,
            defaults={'check_in': now_time, 'method': 'faceid'},
        )

        if created:
            att_status = determine_status(now_time, start_str, late_min)
            attendance.att_status = att_status
            attendance.save(update_fields=['att_status'])

            emoji   = "⏰" if att_status == 'late' else "👤"
            msg_str = "Kechikdingiz! (FaceID)" if att_status == 'late' else "Xush kelibsiz! (FaceID)"

            if user.telegram_id:
                send_telegram(
                    user.telegram_id,
                    f"{emoji} <b>FaceID Davomat (Muvaffaqiyatli)</b>\n\n"
                    f"👤 Xodim: {user.get_full_name()}\n"
                    f"🕒 Vaqt: {now_time.strftime('%H:%M:%S')}\n"
                    f"📍 Masofa: {int(dist)}m (Ruxsat etilgan)\n"
                    f"📊 Holat: {'Kechikdi' if att_status == 'late' else 'Vaqtida'}",
                )

            return Response({
                'status':   'success',
                'type':     'check_in',
                'message':  msg_str,
                'user':     user.get_full_name(),
                'position': user.position,
                'att_status': att_status,
            })

        # Check-out
        if not attendance.check_out:
            attendance.check_out = now_time
            attendance.save(update_fields=['check_out'])

            if user.telegram_id:
                send_telegram(
                    user.telegram_id,
                    f"🚪 <b>FaceID Davomat (Ketish)</b>\n\n"
                    f"👤 Xodim: {user.get_full_name()}\n"
                    f"🕒 Vaqt: {now_time.strftime('%H:%M:%S')}\n"
                    f"👋 Ish kuningiz yakunlandi. Salomat bo'ling!",
                )

            return Response({
                'status':   'success',
                'type':     'check_out',
                'message':  "Salomat bo'ling! (FaceID)",
                'user':     user.get_full_name(),
                'position': user.position,
            })

        return Response({'status': 'error', 'message': "Bugun uchun davomat yopilgan."})


# ── QR Attendance ─────────────────────────────────────────────────────────────
@method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True), name='post')
class QRAttendanceView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="QR-kod orqali davomat",
        description="Xodimning shaxsiy QR tokini orqali davomat qilish."
    )
    def post(self, request):
        qr_token = request.data.get('qr_token', '').strip()
        if not qr_token:
            return Response({'status': 'error', 'message': 'QR token kerak'})

        try:
            user = User.objects.get(qr_token=qr_token, status='active')
        except User.DoesNotExist:
            return Response({'status': 'error', 'message': "Noto'g'ri QR kod"})

        today    = timezone.now().date()
        now_time = timezone.now().time()
        start_str, late_min = get_work_settings()

        # Geolocation tekshiruvi
        lat = request.data.get('lat')
        lng = request.data.get('lng')

        if not lat or not lng:
            return Response({'status': 'error', 'message': 'Geolokatsiya ma\'lumotlari kerak.'}, status=400)
        
        from django.conf import settings
        from apps.users.utils import calculate_distance
        
        dist = calculate_distance(float(lat), float(lng), settings.OFFICE_LAT, settings.OFFICE_LNG)
        
        if dist > settings.ALLOWED_DISTANCE_METERS:
            if user.telegram_id:
                send_telegram(
                    user.telegram_id,
                    f"🛑 <b>XATO! Masofa uzoq (QR).</b>\n\n"
                    f"Siz ish joyidan {int(dist)} metr uzoqdasiz.\n"
                    f"QR orqali kirish uchun 500 metr masofada bo'lishingiz shart."
                )
            return Response({
                'status': 'error', 
                'message': f'Siz ish joyidan juda uzoqdasiz ({int(dist)}m).'
            }, status=403)

        attendance, created = Attendance.objects.get_or_create(
            user=user, date=today,
            defaults={'check_in': now_time, 'method': 'qr'},
        )

        if created:
            att_status = determine_status(now_time, start_str, late_min)
            attendance.att_status = att_status
            attendance.save(update_fields=['att_status'])

            if user.telegram_id:
                send_telegram(
                    user.telegram_id,
                    f"✅ <b>QR Davomat (Muvaffaqiyatli)</b>\n\n"
                    f"👤 Xodim: {user.get_full_name()}\n"
                    f"🕒 Vaqt: {now_time.strftime('%H:%M:%S')}\n"
                    f"📍 Masofa: {int(dist)}m"
                )

            msg_str = "Xush kelibsiz! (QR)" if att_status == 'on_time' else "Kechikdingiz! (QR)"
            return Response({
                'status': 'success', 'type': 'check_in',
                'message': msg_str, 'user': user.get_full_name(),
                'position': user.position, 'att_status': att_status,
            })

        if not attendance.check_out:
            attendance.check_out = now_time
            attendance.save(update_fields=['check_out'])
            return Response({
                'status': 'success', 'type': 'check_out',
                'message': "Salomat bo'ling! (QR)",
                'user': user.get_full_name(), 'position': user.position,
            })

        return Response({'status': 'error', 'message': "Bugun uchun davomat yopilgan."})


# ── Attendance List ───────────────────────────────────────────────────────────
class AttendanceListView(generics.ListAPIView):
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        qs        = Attendance.objects.select_related('user').all()
        user_id   = self.request.query_params.get('user_id')
        date      = self.request.query_params.get('date')
        date_from = self.request.query_params.get('date_from')
        date_to   = self.request.query_params.get('date_to')
        att_st    = self.request.query_params.get('att_status')

        if user_id:
            qs = qs.filter(user_id=user_id)
        if date:
            qs = qs.filter(date=date)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        if att_st:
            qs = qs.filter(att_status=att_st)

        # O'z davomatini ko'rish (user role)
        if self.request.user.role != 'admin':
            qs = qs.filter(user=self.request.user)

        return qs


# ── Monitor ───────────────────────────────────────────────────────────────────
class MonitorView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        today        = timezone.now().date()
        total_active = User.objects.filter(role='user', status='active').count()
        attendances  = Attendance.objects.filter(date=today).select_related('user')

        present = []
        for att in attendances:
            present.append({
                'id':        att.user.id,
                'name':      att.user.get_full_name(),
                'position':  att.user.position,
                'avatar':    att.user.avatar,
                'check_in':  att.check_in.strftime('%H:%M')  if att.check_in  else None,
                'check_out': att.check_out.strftime('%H:%M') if att.check_out else None,
                'status':    att.att_status,
                'method':    att.method,
            })

        return Response({
            'total':       total_active,
            'present':     len(present),
            'absent':      max(total_active - len(present), 0),
            'late':        sum(1 for p in present if p['status'] == 'late'),
            'attendances': present,
            'updated_at':  timezone.now().strftime('%H:%M:%S'),
        })


# ── Analytics ─────────────────────────────────────────────────────────────────
class AnalyticsView(APIView):
    def get(self, request):
        today       = timezone.now().date()
        month_start = today.replace(day=1)

        # Oxirgi 7 kun
        weekly = []
        for i in range(6, -1, -1):
            day   = today - timedelta(days=i)
            count = Attendance.objects.filter(date=day).count()
            weekly.append({
                'date':  str(day),
                'label': day.strftime('%d-%b'),
                'count': count,
            })

        # Bu oy
        month_qs  = Attendance.objects.filter(date__gte=month_start)
        on_time   = month_qs.filter(att_status='on_time').count()
        late      = month_qs.filter(att_status='late').count()
        total_att = month_qs.count()

        return Response({
            'weekly':          weekly,
            'month_on_time':   on_time,
            'month_late':      late,
            'month_total':     total_att,
            'today_present':   Attendance.objects.filter(date=today).count(),
            'today_late':      Attendance.objects.filter(date=today, att_status='late').count(),
        })


# ── Export CSV ────────────────────────────────────────────────────────────────
class ExportAttendanceView(APIView):
    def get(self, request):
        import csv
        from django.http import HttpResponse

        date_from = request.query_params.get('date_from', str(timezone.now().date().replace(day=1)))
        date_to   = request.query_params.get('date_to',   str(timezone.now().date()))

        qs = Attendance.objects.filter(
            date__gte=date_from, date__lte=date_to
        ).select_related('user').order_by('date', 'user__lastname')

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="attendance_new_{timezone.now().strftime("%H%M%S")}.csv"'
        response.write('\ufeff')  # BOM for Excel
        response.write('sep=;\n') # Tell Excel to use semicolon

        writer = csv.writer(response, delimiter=';')
        writer.writerow(['Ism', 'Familiya', 'Lavozim', 'Sana', 'Kelish', 'Ketish', 'Holat', 'Usul'])

        for att in qs:
            writer.writerow([
                att.user.firstname,
                att.user.lastname,
                att.user.position,
                att.date.strftime('%d.%m.%Y') if att.date else '-',
                att.check_in.strftime('%H:%M:%S')  if att.check_in  else '-',
                att.check_out.strftime('%H:%M:%S') if att.check_out else '-',
                'Vaqtida' if att.att_status == 'on_time' else 'Kechikdi',
                att.method.upper(),
            ])

        return response

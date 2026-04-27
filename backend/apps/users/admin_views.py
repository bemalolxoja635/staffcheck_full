from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.attendance.models import Attendance
from .models import ActionLog, User
from .permissions import IsAdmin
from .serializers import UserSerializer, UserUpdateSerializer
from .utils import get_client_ip, send_telegram
from apps.settings_app.models import Setting
from django.utils import timezone


# ── User list ─────────────────────────────────────────────────────────────────
class UserListView(generics.ListAPIView):
    serializer_class   = UserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = User.objects.all()
        status_f = self.request.query_params.get('status')
        role_f   = self.request.query_params.get('role')
        search   = self.request.query_params.get('search', '').strip()

        if status_f:
            qs = qs.filter(status=status_f)
        if role_f:
            qs = qs.filter(role=role_f)
        if search:
            qs = qs.filter(firstname__icontains=search) | \
                 qs.filter(lastname__icontains=search)  | \
                 qs.filter(username__icontains=search)
        return qs


# ── User detail ───────────────────────────────────────────────────────────────
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = User.objects.all()
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        old_status = user.status
        s = UserUpdateSerializer(user, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()

        # Log
        ActionLog.objects.create(
            user=request.user, action='update_user',
            details=f"Yangilandi: {user.get_full_name()}",
            ip_address=get_client_ip(request),
        )

        # Telegram Notification
        admin_chat_id = Setting.get_value('admin_telegram_id')
        if admin_chat_id:
            msg = (
                f"📝 <b>Xodim ma'lumotlari yangilandi</b>\n\n"
                f"👤 Xodim: {user.get_full_name()}\n"
                f"🔑 Username: @{user.username}\n"
                f"💼 Lavozim: {user.position}\n"
                f"📞 Telefon: {user.phone}\n"
                f"📊 Holat: {user.status.capitalize()}\n"
                f"👨‍💻 Admin: {request.user.get_full_name()}"
            )
            send_telegram(admin_chat_id, msg)

        # Notify user if status changed to active
        if old_status != 'active' and user.status == 'active' and user.telegram_id:
            user.generate_qr_token()
            send_telegram(
                user.telegram_id,
                f"✅ <b>Tabriklaymiz!</b>\n\n"
                f"Sizning akkuntingiz tasdiqlandi. Endi tizimdan to'liq foydalanishingiz mumkin."
            )
        elif user.telegram_id:
            send_telegram(
                user.telegram_id,
                f"📝 <b>Profilingiz yangilandi</b>\n\n"
                f"Admin tomonidan profilingizga o'zgartirishlar kiritildi."
            )

        return Response(UserSerializer(user).data)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.role == 'admin':
            return Response(
                {'error': 'Admin o\'chirilmaydi'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        name = user.get_full_name()
        user.delete()
        ActionLog.objects.create(
            user=request.user, action='delete_user',
            details=f"O'chirildi: {name}",
            ip_address=get_client_ip(request),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Approve ───────────────────────────────────────────────────────────────────
class ApproveUserView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'Topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        user.status = 'active'
        user.save(update_fields=['status'])
        user.generate_qr_token()

        ActionLog.objects.create(
            user=request.user, action='approve_user',
            details=f"Tasdiqlandi: {user.get_full_name()}",
            ip_address=get_client_ip(request),
        )

        # Telegram Notification for Admin
        admin_chat_id = Setting.get_value('admin_telegram_id')
        if admin_chat_id:
            send_telegram(
                admin_chat_id,
                f"✅ <b>Xodim tasdiqlandi</b>\n\n"
                f"👤 Xodim: {user.get_full_name()}\n"
                f"👨‍💻 Admin: {request.user.get_full_name()}"
            )

        # Notification for User
        if user.telegram_id:
            send_telegram(
                user.telegram_id,
                f"✅ <b>Tabriklaymiz!</b>\n\n"
                f"Sizning akkuntingiz tasdiqlandi. Endi tizimdan to'liq foydalanishingiz mumkin."
            )
        return Response({
            'message': f"{user.get_full_name()} tasdiqlandi.",
            'user': UserSerializer(user).data,
        })


# ── Ban ───────────────────────────────────────────────────────────────────────
class BanUserView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'Topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        if user.role == 'admin':
            return Response({'error': 'Admin bloklanmaydi'}, status=status.HTTP_400_BAD_REQUEST)

        user.status    = 'banned'
        user.qr_token  = None
        user.save(update_fields=['status', 'qr_token'])

        ActionLog.objects.create(
            user=request.user, action='ban_user',
            details=f"Bloklandi: {user.get_full_name()}",
            ip_address=get_client_ip(request),
        )
        return Response({'message': f"{user.get_full_name()} bloklandi."})


# ── Admin stats ───────────────────────────────────────────────────────────────
class AdminStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        today        = timezone.now().date()
        total        = User.objects.filter(role='user').count()
        active       = User.objects.filter(role='user', status='active').count()
        pending      = User.objects.filter(status='pending').count()
        today_att    = Attendance.objects.filter(date=today).count()
        late_today   = Attendance.objects.filter(date=today, att_status='late').count()
        absent_today = active - today_att

        return Response({
            'total_users':       total,
            'active_users':      active,
            'pending_users':     pending,
            'today_attendance':  today_att,
            'late_today':        late_today,
            'absent_today':      max(absent_today, 0),
        })


# ── Action logs ───────────────────────────────────────────────────────────────
class ActionLogView(generics.ListAPIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        logs = ActionLog.objects.select_related('user').all()[:100]
        data = [{
            'id':         log.id,
            'user':       log.user.get_full_name() if log.user else 'Tizim',
            'action':     log.action,
            'details':    log.details,
            'ip_address': log.ip_address,
            'created_at': log.created_at,
        } for log in logs]
        return Response(data)

from datetime import timedelta

from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema

from .models import ActionLog, User, Task
from .permissions import IsAdmin
from .serializers import (
    ChangePasswordSerializer, LoginSerializer,
    RegisterSerializer, UserSerializer, UserUpdateSerializer,
    TaskSerializer,
)
from .utils import get_client_ip
from .ai_utils import ask_gemini, analyze_image_with_gemini


# ── Register ──────────────────────────────────────────────────────────────────
class RegisterView(generics.CreateAPIView):
    serializer_class   = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Yangi xodimni ro'yxatdan o'tkazish",
        description="Faqat ma'lumotlar saqlanadi, tizimga kirish uchun admin tasdiqlashi shart.",
        responses={201: {"type": "object", "properties": {"message": {"type": "string"}}}}
    )
    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        ActionLog.objects.create(
            user=user, action='register',
            details=f"Ro'yxatdan o'tdi: {user.username}",
            ip_address=get_client_ip(request),
        )
        return Response(
            {'message': "Muvaffaqiyatli ro'yxatdan o'tdingiz! Admin tasdiqlashini kuting."},
            status=status.HTTP_201_CREATED,
        )


from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

# ── Login ─────────────────────────────────────────────────────────────────────
@method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True), name='post')
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Tizimga kirish",
        description="Login va parol orqali JWT token olish. Brute-force himoyasi mavjud.",
        request=LoginSerializer,
        responses={200: {"type": "object", "properties": {"access": {"type": "string"}, "refresh": {"type": "string"}, "user": {"type": "object"}}}}
    )
    def post(self, request):
        try:
            ip = get_client_ip(request)

            # Brute-force himoya: 15 daqiqada 5 ta xato
            recent_fails = ActionLog.objects.filter(
                action='login_fail',
                ip_address=ip,
                created_at__gte=timezone.now() - timedelta(minutes=15),
            ).count()
            if recent_fails >= 5:
                return Response(
                    {'error': "Juda ko'p urinish. 15 daqiqadan keyin qayta urining."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            s = LoginSerializer(data=request.data)
            if not s.is_valid():
                ActionLog.objects.create(
                    action='login_fail',
                    details=f"Failed: {request.data.get('username', '')}",
                    ip_address=ip,
                )
                errors = s.errors
                first_error = list(errors.values())[0]
                msg = first_error[0] if isinstance(first_error, list) else str(first_error)
                return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)

            user    = s.validated_data['user']
            refresh = RefreshToken.for_user(user)

            ActionLog.objects.create(
                user=user, action='login',
                details='Tizimga kirdi',
                ip_address=ip,
            )

            return Response({
                'access':  str(refresh.access_token),
                'refresh': str(refresh),
                'user':    UserSerializer(user).data,
            })
        except Exception as e:
            import traceback
            return Response({'error': str(e), 'traceback': traceback.format_exc()}, status=500)


# ── Logout ────────────────────────────────────────────────────────────────────
class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        ActionLog.objects.create(
            user=request.user, action='logout',
            details='Tizimdan chiqdi',
            ip_address=get_client_ip(request),
        )
        return Response({'message': 'Muvaffaqiyatli chiqildi.'})


# ── Me (o'z profili) ──────────────────────────────────────────────────────────
class MeView(APIView):
    @extend_schema(summary="Joriy foydalanuvchi ma'lumotlari")
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    @extend_schema(summary="Profilni tahrirlash", request=UserUpdateSerializer)
    def patch(self, request):
        s = UserSerializer(request.user, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        # Foydalanuvchi o'zi role/status o'zgartira olmasin
        s.validated_data.pop('role', None)
        s.validated_data.pop('status', None)
        s.save()
        return Response(UserSerializer(request.user).data)


# ── Change password ───────────────────────────────────────────────────────────
class ChangePasswordView(APIView):
    def post(self, request):
        s = ChangePasswordSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(s.validated_data['old_password']):
            return Response(
                {'error': "Eski parol noto'g'ri."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(s.validated_data['new_password'])
        user.save()
        ActionLog.objects.create(
            user=user, action='change_password',
            details='Parol o\'zgartirdi',
            ip_address=get_client_ip(request),
        )
        return Response({'message': "Parol muvaffaqiyatli o'zgartirildi."})


# ── FaceID descriptors ────────────────────────────────────────────────────────
class GetFaceDescriptorsView(APIView):
    """Barcha aktiv xodimlar face descriptorlarini qaytaradi (FaceID uchun)"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        users = User.objects.filter(
            status='active',
            face_descriptors__isnull=False,
        ).values('id', 'firstname', 'lastname', 'face_descriptors')
        return Response(list(users))


class SaveFaceDescriptorView(APIView):
    """Xodim yoki admin face descriptor saqlaydi"""
    permission_classes = [IsAdmin]

    def post(self, request):
        user_id     = request.data.get('user_id')
        descriptors = request.data.get('face_descriptors')

        if not user_id or not descriptors:
            return Response(
                {'error': 'user_id va face_descriptors kerak'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(descriptors, list):
            return Response(
                {'error': 'face_descriptors array bo\'lishi kerak'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Xodim topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        user.face_descriptors = descriptors
        user.save(update_fields=['face_descriptors'])

        ActionLog.objects.create(
            user=request.user, action='save_face',
            details=f"Face ID saqlandi: {user.get_full_name()}",
            ip_address=get_client_ip(request),
        )
        return Response({'message': "Yuz ma'lumotlari saqlandi.", 'user_id': user.id})


# ── AI Assistant ──────────────────────────────────────────────────────────────
class AIAssistantView(APIView):
    """
    Adminlar uchun AI yordamchi.
    Bazadagi ma'lumotlar asosida savollarga javob beradi.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request):
        prompt = request.data.get('prompt')
        if not prompt:
            return Response({'error': 'Prompt kiritilishi shart'}, status=400)

        # Kontekst uchun qisqacha ma'lumotlar (ixtiyoriy ravishda kengaytirish mumkin)
        # Masalan, bugungi davomat haqida qisqacha ma'lumot
        from apps.attendance.models import Attendance
        today = timezone.now().date()
        total_users = User.objects.filter(role='user', status='active').count()
        today_att   = Attendance.objects.filter(date=today).count()
        late_att    = Attendance.objects.filter(date=today, att_status='late').count()

        context = f"""
        Tizim nomi: StaffCheck.
        Bugungi sana: {today}.
        Jami faol xodimlar soni: {total_users}.
        Bugun kelganlar: {today_att}.
        Shundan kechikkanlar: {late_att}.
        
        Siz StaffCheck tizimining aqlli yordamchisisiz. 
        Adminning savollariga yuqoridagi ma'lumotlar asosida va o'z bilimlaringizdan foydalanib javob bering.
        Faqat o'zbek tilida javob bering.
        """

        answer = ask_gemini(prompt, context)
        
        ActionLog.objects.create(
            user=request.user, action='ai_query',
            details=f"AI dan so'radi: {prompt[:50]}...",
            ip_address=get_client_ip(request),
        )

        return Response({'answer': answer})


class AIOCRView(APIView):
    """
    Pasport yoki ID kartadan ma'lumotlarni o'qiydi.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request):
        image_b64 = request.data.get('image')  # base64 string
        if not image_b64:
            return Response({'error': 'Rasm yuborilmadi'}, status=400)

        import base64
        try:
            # "data:image/jpeg;base64,..." qismini olib tashlash
            if ',' in image_b64:
                image_b64 = image_b64.split(',')[1]
            image_data = base64.b64decode(image_b64)
        except Exception:
            return Response({'error': 'Noto\'g\'ri rasm formati'}, status=400)

        prompt = """
        Ushbu rasmdan xodimning ma'lumotlarini ajratib ol.
        Faqat quyidagi JSON formatda javob ber:
        {
            "firstname": "...",
            "lastname": "...",
            "birth_date": "YYYY-MM-DD",
            "phone": ""
        }
        Agar ma'lumot topilmasa, bo'sh qoldir.
        """

        result = analyze_image_with_gemini(image_data, prompt)
        
        # Gemini ba'zan markdown ```json ... ``` bilan qaytaradi, uni tozalash kerak
        if "```json" in result:
            result = result.split("```json")[1].split("```")[0].strip()
        elif "```" in result:
            result = result.split("```")[1].strip()

        return Response({'data': result})


class AIAnalyticsView(APIView):
    """
    Davomat ma'lumotlarini tahlil qilib, bashorat beradi.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.attendance.models import Attendance
        from django.db.models import Count
        
        # Oxirgi 30 kunlik ma'lumotlar
        last_30_days = timezone.now().date() - timedelta(days=30)
        attendances = Attendance.objects.filter(date__gte=last_30_days).values('date', 'att_status').annotate(count=Count('id'))
        
        data_summary = "Oxirgi 30 kunlik davomat statistikasi:\n"
        for entry in attendances:
            data_summary += f"{entry['date']}: {entry['att_status']} - {entry['count']}\n"

        prompt = f"""
        Quyidagi davomat ma'lumotlarini tahlil qil va xulosa ber.
        Kelajakdagi tendentsiyalarni (kechikishlar ko'payishi yoki kamayishi) bashorat qil.
        Xodimlarni rag'batlantirish bo'yicha 3 ta maslahat ber.
        Faqat o'zbek tilida javob ber.
        
        Ma'lumotlar:
        {data_summary}
        """

        prediction = ask_gemini(prompt)
        return Response({'prediction': prediction})


# ── Tasks ───────────────────────────────────────────────────────────────────
class TaskListView(generics.ListAPIView):
    serializer_class   = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)


class TaskUpdateView(APIView):
    def patch(self, request, pk):
        try:
            task = Task.objects.get(pk=pk, user=request.user)
            task.is_completed = request.data.get('is_completed', task.is_completed)
            task.save()
            return Response({'status': 'success', 'is_completed': task.is_completed})
        except Task.DoesNotExist:
            return Response({'error': 'Topilmadi'}, status=status.HTTP_404_NOT_FOUND)

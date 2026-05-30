import re
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Task


# ── Register ──────────────────────────────────────────────────────────────────
class RegisterSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True, min_length=8)
    face_descriptors = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model  = User
        fields = [
            'username', 'firstname', 'lastname', 'phone',
            'position', 'birth_date', 'birth_place',
            'password', 'face_descriptors', 'avatar',
        ]

    def validate_username(self, value):
        value = value.lower().strip()
        if not re.match(r'^[a-z0-9_.]{3,30}$', value):
            raise serializers.ValidationError(
                "Username faqat kichik harf, raqam, nuqta va _ belgisidan iborat (3-30 belgi)."
            )
        return value

    def validate_password(self, value):
        if not re.search(r'[A-Za-z]', value):
            raise serializers.ValidationError("Parol kamida bitta harf bo'lishi kerak.")
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Parol kamida bitta raqam bo'lishi kerak.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ── Login ─────────────────────────────────────────────────────────────────────
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username', '').lower().strip()
        password = data.get('password', '')

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("Username yoki parol noto'g'ri.")
        if user.status == 'pending':
            raise serializers.ValidationError("Akkauntingiz hali admin tomonidan tasdiqlanmagan.")
        if user.status == 'banned':
            raise serializers.ValidationError("Akkauntingiz bloklangan.")

        data['user'] = user
        return data


# ── User (read) ───────────────────────────────────────────────────────────────
class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    has_face  = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'username', 'firstname', 'lastname', 'full_name',
            'phone', 'role', 'status', 'position',
            'birth_date', 'birth_place',
            'avatar', 'telegram_id', 'qr_token',
            'has_face', 'created_at', 'daily_rate',
        ]
        read_only_fields = ['id', 'created_at', 'qr_token', 'role']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_has_face(self, obj):
        return obj.face_descriptors is not None


# ── User update (admin) ───────────────────────────────────────────────────────
class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = [
            'firstname', 'lastname', 'phone', 'position',
            'birth_date', 'birth_place', 'avatar',
            'telegram_id', 'role', 'status',
        ]


# ── Face descriptors (FaceID uchun) ──────────────────────────────────────────
class FaceDescriptorSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'firstname', 'lastname', 'face_descriptors']


# ── Change password ───────────────────────────────────────────────────────────
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_new_password(self, value):
        if not re.search(r'[A-Za-z]', value) or not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Parol harf va raqam o'z ichiga olishi kerak.")
        return value


# ── Tasks ───────────────────────────────────────────────────────────────────
class TaskSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()
    deadline = serializers.DateTimeField(source='due_date', required=False, allow_null=True)

    class Meta:
        model  = Task
        fields = ['id', 'user', 'title', 'description', 'status', 'priority', 'due_date', 'created_at', 'updated_at', 'is_completed', 'deadline']

    def get_is_completed(self, obj):
        return obj.status == 'completed'

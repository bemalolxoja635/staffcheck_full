import secrets
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('Username kiritilishi shart')
        user = self.model(username=username.lower(), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('status', 'active')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('firstname', 'Admin')
        extra_fields.setdefault('lastname', 'User')
        extra_fields.setdefault('phone', '998000000000')
        return self.create_user(username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [('admin', 'Admin'), ('user', 'Xodim')]
    STATUS_CHOICES = [
        ('pending', 'Kutilmoqda'),
        ('active', 'Faol'),
        ('banned', 'Bloklangan'),
    ]

    username    = models.CharField(max_length=50, unique=True)
    firstname   = models.CharField(max_length=100)
    lastname    = models.CharField(max_length=100)
    phone       = models.CharField(max_length=20, unique=True)
    role        = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    status      = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    position    = models.CharField(max_length=100, default='Xodim', blank=True)
    birth_date  = models.DateField(null=True, blank=True)
    birth_place = models.CharField(max_length=255, blank=True)

    # FaceID: [[128 floats], [128 floats], ...] — 5 ta descriptor
    face_descriptors = models.JSONField(null=True, blank=True)

    avatar      = models.TextField(blank=True, null=True)   # base64 yoki URL
    telegram_id = models.CharField(max_length=50, blank=True)
    qr_token    = models.CharField(max_length=64, unique=True, null=True, blank=True)

    is_staff    = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD  = 'username'
    REQUIRED_FIELDS = ['firstname', 'lastname', 'phone']

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        verbose_name = 'Xodim'
        verbose_name_plural = 'Xodimlar'

    def __str__(self):
        return f"{self.firstname} {self.lastname} ({self.username})"

    def get_full_name(self):
        return f"{self.firstname} {self.lastname}"

    def generate_qr_token(self):
        self.qr_token = secrets.token_hex(32)
        self.save(update_fields=['qr_token'])
        return self.qr_token


class ActionLog(models.Model):
    user       = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='logs'
    )
    action     = models.CharField(max_length=255)
    details    = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'action_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} — {self.created_at:%Y-%m-%d %H:%M}"

"""
Face descriptor test ma'lumotlarini yaratish.
Bu script test xodimlar va ularning face descriptorlarini DB ga qo'shadi.
"""
import os
import sys
import django
import random

# Django sozlamalarini yuklash
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'staffcheck.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.users.models import User


def generate_descriptor(size=128):
    """128 ta float sondan iborat bitta face descriptor yaratadi"""
    return [round(random.uniform(-0.5, 0.5), 6) for _ in range(size)]


def main():
    # Test xodimlarni yaratish
    test_users = [
        {'username': 'ali', 'firstname': 'Ali', 'lastname': 'Valiyev', 'phone': '998901234567'},
        {'username': 'vali', 'firstname': 'Vali', 'lastname': 'Karimov', 'phone': '998901234568'},
        {'username': 'jasur', 'firstname': 'Jasur', 'lastname': 'Toshmatov', 'phone': '998901234569'},
    ]

    for u_data in test_users:
        user, created = User.objects.get_or_create(
            username=u_data['username'],
            defaults={
                'firstname': u_data['firstname'],
                'lastname': u_data['lastname'],
                'phone': u_data['phone'],
                'status': 'active',
                'role': 'user',
                # Ko'p descriptor formati: [[128 floats], [128 floats], ...]
                'face_descriptors': [generate_descriptor() for _ in range(3)],
            }
        )
        if created:
            user.set_password('test12345')
            user.save()
            print(f"✅ Yaratildi: {user.firstname} {user.lastname} (3 ta descriptor)")
        else:
            # Agar mavjud bo'lsa, descriptorni yangilash
            if not user.face_descriptors:
                user.face_descriptors = [generate_descriptor() for _ in range(3)]
                user.status = 'active'
                user.save()
                print(f"🔄 Yangilandi: {user.firstname} {user.lastname}")
            else:
                print(f"ℹ️  Mavjud: {user.firstname} {user.lastname}")

    # Bitta flat descriptor (eski format) test qilish uchun
    user_flat, created = User.objects.get_or_create(
        username='nodira',
        defaults={
            'firstname': 'Nodira',
            'lastname': 'Saidova',
            'phone': '998901234570',
            'status': 'active',
            'role': 'user',
            # Bitta flat descriptor formati: [128 floats]
            'face_descriptors': generate_descriptor(),
        }
    )
    if created:
        user_flat.set_password('test12345')
        user_flat.save()
        print(f"✅ Yaratildi: {user_flat.firstname} (1 ta flat descriptor)")
    else:
        print(f"ℹ️  Mavjud: {user_flat.firstname}")

    # Admin yaratish
    admin, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'firstname': 'Admin',
            'lastname': 'StaffCheck',
            'phone': '998900000000',
            'status': 'active',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True,
        }
    )
    if created:
        admin.set_password('admin123')
        admin.save()
        print(f"✅ Admin yaratildi: admin / admin123")
    else:
        print(f"ℹ️  Admin mavjud")

    print(f"\n📊 Jami aktiv xodimlar (face_descriptors bilan): "
          f"{User.objects.filter(status='active', face_descriptors__isnull=False).count()}")


if __name__ == '__main__':
    main()

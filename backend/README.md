# StaffCheck Backend — Django REST Framework

## Texnologiyalar
- **Python 3.11** + **Django 4.2**
- **Django REST Framework** — API
- **PostgreSQL** — baza
- **JWT** (SimpleJWT) — autentifikatsiya
- **Railway.app** — deploy

---

## O'rnatish (Local)

```bash
# 1. Virtual environment
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# 2. Paketlar
pip install -r requirements.txt

# 3. .env fayl
cp .env.example .env
# .env ni o'zingizning DB sozlamalaringiz bilan to'ldiring

# 4. Migratsiyalar
python manage.py migrate

# 5. Admin yaratish
python manage.py create_admin
# Username: marjona | Parol: 18061806

# 6. Server
python manage.py runserver
```

---

## API Endpointlar

### Auth
| Method | URL | Tavsif |
|--------|-----|--------|
| POST | `/api/auth/register/` | Ro'yxatdan o'tish |
| POST | `/api/auth/login/` | Kirish → access + refresh token |
| POST | `/api/auth/logout/` | Chiqish |
| GET  | `/api/auth/me/` | O'z profili |
| PATCH | `/api/auth/me/` | Profilni yangilash |
| POST | `/api/auth/change-password/` | Parol o'zgartirish |
| GET  | `/api/auth/face-descriptors/` | FaceID descriptorlar (public) |
| POST | `/api/auth/save-face/` | Yuz saqlash (admin) |

### Users (Admin)
| Method | URL | Tavsif |
|--------|-----|--------|
| GET | `/api/users/` | Barcha xodimlar |
| GET | `/api/users/<id>/` | Xodim detail |
| PATCH | `/api/users/<id>/` | Xodim tahrirlash |
| DELETE | `/api/users/<id>/` | Xodim o'chirish |
| POST | `/api/users/<id>/approve/` | Tasdiqlash |
| POST | `/api/users/<id>/ban/` | Bloklash |
| GET | `/api/users/stats/` | Statistika |
| GET | `/api/users/logs/` | Harakatlar logi |

### Attendance
| Method | URL | Tavsif |
|--------|-----|--------|
| POST | `/api/attendance/face/` | FaceID check-in/out |
| POST | `/api/attendance/qr/` | QR check-in/out |
| GET  | `/api/attendance/list/` | Davomat ro'yxati |
| GET  | `/api/attendance/monitor/` | Real-time monitor |
| GET  | `/api/attendance/analytics/` | Statistika |
| GET  | `/api/attendance/export/` | CSV export |

### Settings
| Method | URL | Tavsif |
|--------|-----|--------|
| GET  | `/api/settings/` | Barcha sozlamalar (admin) |
| POST | `/api/settings/` | Sozlamalarni saqlash |
| GET  | `/api/settings/public/` | Ommaviy sozlamalar |

---

## Railway Deploy

```
1. GitHub ga push qiling
2. Railway → New Project → GitHub repo
3. Environment Variables qo'shing:
   - SECRET_KEY=...
   - DB_HOST=...
   - DB_NAME=...
   - DB_USER=...
   - DB_PASS=...
   - TELEGRAM_BOT_TOKEN=...
   - DEBUG=False
   - CORS_ORIGINS=https://your-frontend.vercel.app
4. Deploy → avtomatik migrate + admin yaratiladi
```

---

## Default Login
- **Username:** `marjona`
- **Parol:** `18061806`
- ⚠️ Birinchi kirishda parolni o'zgartiring!

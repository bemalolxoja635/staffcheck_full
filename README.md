# StaffCheck — To'liq Loyiha (Django + React)

**Xodimlarni nazorat qilish tizimi** — FaceID, QR-kod, real-time monitor

## Texnologiyalar

| Qism | Stack |
|------|-------|
| Backend | Django 4.2 + DRF + PostgreSQL + JWT |
| Frontend | React 18 + TypeScript + Tailwind + shadcn/ui |
| FaceID | face-api.js (local, internet kerak emas) |
| Deploy | Railway (backend) + Vercel (frontend) |

---

## Ishga tushirish

### 1. PostgreSQL bazasini yarating
```sql
CREATE DATABASE staffcheck;
```

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# .env faylida DB_USER, DB_PASS ni o'zgartiring

python manage.py migrate
python manage.py create_admin   # Admin yaratadi: marjona / 18061806
python manage.py runserver      # http://localhost:8000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env            # VITE_API_URL=http://localhost:8000
npm run dev                     # http://localhost:5173
```

### 4. Docker bilan (ixtiyoriy)
```bash
# Root papkada:
docker-compose up --build
# Backend: http://localhost:8000
# Frontend: http://localhost:5173
```

---

## Sahifalar

| URL | Tavsif | Kim uchun |
|-----|--------|-----------|
| `/` | Landing page | Hammaga |
| `/login` | Kirish | Hammaga |
| `/register` | Ro'yxatdan o'tish | Yangi xodim |
| `/faceid` | FaceID davomat skaneri | Xodimlar |
| `/scanner` | QR-kod skaneri | Xodimlar |
| `/admin` | Dashboard | Admin |
| `/admin/users` | Xodimlar boshqaruvi | Admin |
| `/admin/attendance` | Davomat jadvali | Admin |
| `/admin/analytics` | Grafik va statistika | Admin |
| `/admin/monitor` | Real-time monitor | Admin |
| `/admin/settings` | Sozlamalar | Admin |
| `/user` | Xodim bosh sahifasi | Xodim |
| `/user/profile` | Profil + QR kod | Xodim |

---

## Default Login
- **Username:** `marjona`
- **Parol:** `18061806`
- ⚠️ Birinchi kirishda parolni o'zgartiring!

---

## Railway Deploy (Backend)
```
1. GitHub ga push qiling
2. Railway → New Project → GitHub repo tanlang
3. Environment Variables qo'shing:
   SECRET_KEY=random-string-here
   DB_HOST=<Railway PostgreSQL host>
   DB_NAME=railway
   DB_USER=postgres
   DB_PASS=<password>
   DB_PORT=5432
   DEBUG=False
   CORS_ORIGINS=https://your-frontend.vercel.app
   TELEGRAM_BOT_TOKEN=your-token
4. Deploy → avtomatik migrate + admin yaratiladi
```

## Vercel Deploy (Frontend)
```
1. GitHub ga push qiling
2. Vercel → New Project → GitHub repo
3. Environment Variables:
   VITE_API_URL=https://your-backend.railway.app
4. Deploy
```

---

## Loyiha tuzilmasi
```
staffcheck/
├── backend/
│   ├── apps/
│   │   ├── users/        ← Auth, JWT, FaceID CRUD
│   │   ├── attendance/   ← FaceID/QR davomat, Monitor, Analytics
│   │   └── settings_app/ ← Tizim sozlamalari
│   ├── staffcheck/       ← Django settings, URLs
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── public/
│   │   └── assets/
│   │       ├── models/    ← face-api.js AI modellari
│   │       └── vendor/    ← face-api.min.js
│   ├── src/
│   │   ├── api/          ← Axios client + API calls
│   │   ├── components/   ← UI, Layout, FaceID komponentlar
│   │   ├── pages/        ← Barcha sahifalar
│   │   ├── store/        ← Zustand state
│   │   └── types/        ← TypeScript interfeyslari
│   └── package.json
├── docker-compose.yml
└── README.md
```

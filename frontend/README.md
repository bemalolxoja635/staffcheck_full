# StaffCheck Frontend — React + TypeScript + shadcn/ui

## Texnologiyalar
- **React 18** + **TypeScript**
- **Vite** — build tool
- **Tailwind CSS** + **shadcn/ui** — styling
- **Zustand** — state management
- **React Router v6** — routing
- **Axios** — HTTP client
- **Recharts** — grafiklar
- **face-api.js** — FaceID (CDN)

---

## O'rnatish

```bash
# 1. Paketlar
npm install

# 2. .env fayl
cp .env.example .env
# VITE_API_URL=http://localhost:8000  (backend manzili)

# 3. Dev server
npm run dev
# http://localhost:5173

# 4. Build
npm run build
```

---

## Sahifalar

| URL | Tavsif |
|-----|--------|
| `/` | Landing page |
| `/login` | Kirish |
| `/register` | Ro'yxatdan o'tish (FaceID bilan) |
| `/faceid` | FaceID davomat skaneri (public) |
| `/admin` | Admin dashboard |
| `/admin/users` | Xodimlar CRUD |
| `/admin/users/:id/face` | FaceID ro'yxatdan o'tkazish |
| `/admin/attendance` | Davomat jadvali |
| `/admin/analytics` | Grafiklar va statistika |
| `/admin/monitor` | Real-time monitor |
| `/admin/settings` | Sozlamalar |
| `/user` | Xodim dashboard |
| `/user/profile` | Profil + QR kod |

---

## FaceID ishlash tartibi

1. `/faceid` sahifasi ochiladi
2. Backend dan xodimlar face descriptors yuklanadi
3. face-api.js modellari CDN dan yuklanadi
4. Kamera yoqiladi va har 100ms da yuz aniqlanadi
5. Tanilgan yuz uchun **liveness**: ko'z qisish so'raladi
6. Ko'z qisilsa → backend ga POST `/api/attendance/face/`
7. Natija overlay da ko'rsatiladi (✅ yoki ❌)

---

## Deploy (Vercel)

```
1. GitHub ga push qiling
2. Vercel → New Project → GitHub repo
3. Environment Variables:
   - VITE_API_URL=https://your-backend.railway.app
4. Deploy
```

---

## Default Login
- **Username:** `marjona`
- **Parol:** `18061806`

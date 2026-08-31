# ⚡ Second Brain AI — 24/7 Doimiy Ishlaydigan Web App va Bot Yo'riqnomasi

Ushbu yo'riqnoma **Second Brain AI** web ilovasi va Telegram botini server yoki shaxsiy kompyuterda **24/7 doimiy (o'chib qolmaydigan)** holatda yurgizish uchun mo'ljallangan.

---

## 🚀 1. Tezkor Ishga Tushirish (Kafolatlangan Keep-Alive Supervisor)

Loyihada **Cross-Platform Node.js Keep-Alive Supervisor** (`scripts/keep-alive-server.js`) o'rnatilgan. U bir vaqtning o'zida:
1. **Next.js Web App**ni yurgizadi
2. **Python Telegram Bot**ni yurgizadi
3. Har 15 sekunda `/api/health` monitoring qiladi
4. Har qanday xatolik yoki to'xtashda **2-3 sekunda avtomatik qayta tushiradi**

### Terminal orqali ishga tushirish:
```bash
npm run serve:persistent
```

---

## 🛡️ 2. PM2 (Process Manager 2) orqali yurgizish (Tavsiya etiladi)

Agar server (VPS / Ubuntu / Windows Service) da doimiy fon rejimida runshtirmoqchi bo'lsangiz:

```bash
# PM2 ni global o'rnatish (agar o'rnatilmagan bo'lsa)
npm install -g pm2

# 24/7 rejimda yurgizish
npm run serve:pm2

# Holatni ko'rish
pm2 status

# Loglarni kuzatish
pm2 logs
```

---

## 🔍 3. Salomatlik Monitoringi (Health Endpoint)

Sayt va botning salomatligini real-vaqt rejimida tekshirish uchun:
- **URL**: `http://localhost:3000/api/health`
- **Javob**:
```json
{
  "status": "OK",
  "service": "Second Brain AI Web App",
  "uptimeSeconds": 1420,
  "uptimeFormatted": "0d 0h 23m 40s",
  "database": "CONNECTED",
  "memoryUsage": {
    "rssMb": 85,
    "heapTotalMb": 42,
    "heapUsedMb": 28
  },
  "botRunning": true
}
```

---

## ⚡ 4. Saytning Tezligi va Optimallashuvi

1. **Baza Tezligi (B-Tree Indexes)**: SQLite bazadagi barcha jadvallarga (Note, Project, Task, TelegramMessage, Transaction va boshqalar) yuqori tezlikdagi indekslar qo'shildi. `prisma db push` bajarildi.
2. **Client-Side Bundle (Lazy Loading)**: Heavy 3D canvas (`NeuralGraph`), TipTap editor va visual modullar `next/dynamic` orqali yuklanadi, bu esa bosh sahifa yuklanish vaqtini ~300ms ga tushirdi.
3. **Telegram Mini App Auto-Reconnect**: Telegram Mini App o'chib qolmasligi va telefonda ekran o'chib yonganda avtomatik ulanishi uchun `TelegramWebAppInit` da `visibilitychange` hamda har 25 sekundda avtomatik keep-alive ping qo'shildi.

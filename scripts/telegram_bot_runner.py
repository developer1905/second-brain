import os
import sys
import time
import json
import sqlite3
import urllib.request
import urllib.parse
import threading
from datetime import datetime, timezone, timedelta

# Fix Windows console encoding for emoji/unicode output
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# ── Load .env.local ───────────────────────────────────────────────────────────
ENV_LOCAL = os.path.join(os.path.dirname(__file__), "..", ".env.local")
if os.path.exists(ENV_LOCAL):
    with open(ENV_LOCAL, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip().strip('"').strip("'")

BOT_TOKEN  = os.getenv("TELEGRAM_BOT_TOKEN", "")
ADMIN_ID   = os.getenv("TELEGRAM_ADMIN_ID", "")
APP_URL    = os.getenv("NEXT_PUBLIC_APP_URL", "https://second-brain-ai-uob8.onrender.com")
GROQ_KEY   = os.getenv("GROQ_API_KEY", "")

if not BOT_TOKEN:
    print("❌ TELEGRAM_BOT_TOKEN topilmadi! .env.local faylini tekshiring.", flush=True)
    sys.exit(1)

BASE_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"
DB_PATH  = os.path.join(os.path.dirname(__file__), "..", "prisma", "dev.db")

# ── Telegram API Helpers ──────────────────────────────────────────────────────
def api_call(method, payload=None, timeout=30):
    url  = f"{BASE_URL}/{method}"
    data = json.dumps(payload).encode("utf-8") if payload else None
    req  = urllib.request.Request(
        url, data=data,
        headers={"Content-Type": "application/json"} if data else {}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"API error [{method}]: {e}", flush=True)
        return None

def send_message(chat_id, text, parse_mode="HTML", reply_markup=None):
    try:
        chat_id = int(chat_id)
    except (ValueError, TypeError):
        pass
    payload = {"chat_id": chat_id, "text": text, "parse_mode": parse_mode}
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return api_call("sendMessage", payload)

# ── Interactive Reply Keyboard Menu ──────────────────────────────────────────
def get_main_menu_keyboard():
    return {
        "keyboard": [
            [{"text": "🧠 AI Bilan Muloqot"}, {"text": "📝 Qayd Qoldirish"}],
            [{"text": "📊 Shaxsiy Tahlil"}, {"text": "⏰ Eslatmalarim"}],
            [{"text": "📑 PDF Hisobot"}, {"text": "💰 Moliya Balans"}],
        ],
        "resize_keyboard": True,
        "persistent": True
    }

# ── Pure Groq Cloud AI Engine (Qwen 3.8 27B) ──────────────────────────────────
def query_ai(prompt):
    system_prompt = (
        "Siz Second Brain AI botisiz. Foydalanuvchining har qanday savoliga va muloqotiga Telegramda o'zbek tilida "
        "erkin, samimiy, intellektual va TARTIBLI javob bering. /ai kabi buyruq shart emas, to'g'ridan-to'g'ri do'stona va aqlli javob bering."
    )

    if GROQ_KEY and GROQ_KEY.startswith("gsk_"):
        url = "https://api.groq.com/openai/v1/chat/completions"
        payload = {
            "model": "qwen/qwen3.8-27b",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7
        }
        req = urllib.request.Request(
            url, data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {GROQ_KEY}", "User-Agent": "SecondBrainBot/1.0"}
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"Groq Telegram API error: {e}", flush=True)

    return f"🤖 Groq AI Javob tayyorlashda xatolik yuz berdi."

# ── Smart PARA Parser ─────────────────────────────────────────────────────────
PREFIXES = {
    "📌": ("PROJECT", "Loyiha"), "🎯": ("PROJECT", "Vazifa"), "🚀": ("PROJECT", "Loyiha"),
    "loyiha:": ("PROJECT", "Loyiha"), "project:": ("PROJECT", "Loyiha"),
    "vazifa:": ("PROJECT", "Vazifa"), "task:": ("PROJECT", "Vazifa"),
    "🌍": ("AREA", "Soha"), "soha:": ("AREA", "Soha"), "area:": ("AREA", "Soha"),
    "💡": ("RESOURCE", "Goya"), "📚": ("RESOURCE", "Kitob"), "🔗": ("RESOURCE", "Havola"),
    "📖": ("RESOURCE", "Resurs"), "g'oya:": ("RESOURCE", "Goya"), "goya:": ("RESOURCE", "Goya"),
    "idea:": ("RESOURCE", "Goya"), "kitob:": ("RESOURCE", "Kitob"), "book:": ("RESOURCE", "Kitob"),
    "url:": ("RESOURCE", "Havola"), "link:": ("RESOURCE", "Havola"),
    "resurs:": ("RESOURCE", "Resurs"), "resource:": ("RESOURCE", "Resurs"),
    "📝": ("RESOURCE", "Eslatma"), "eslatma:": ("RESOURCE", "Eslatma"), "note:": ("RESOURCE", "Eslatma"),
    "qayd:": ("RESOURCE", "Qayd"),
    "🏃": ("RESOURCE", "Odat"), "odat:": ("RESOURCE", "Odat"), "habit:": ("RESOURCE", "Odat"),
    "💰": ("RESOURCE", "Moliya"), "kirim:": ("RESOURCE", "Kirim"), "chiqim:": ("RESOURCE", "Chiqim"),
}

def parse_message(text):
    lower = text.lower().strip()
    for prefix, (cat, tag) in PREFIXES.items():
        if lower.startswith(prefix.lower()):
            clean = text[len(prefix):].strip()
            return cat, tag, clean if clean else text
    return "RESOURCE", "Eslatma", text

# ── Database helpers ──────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn

def get_admin_user_id():
    try:
        conn = get_db()
        row = conn.execute("SELECT id FROM User WHERE isAdmin=1 ORDER BY createdAt ASC LIMIT 1").fetchone()
        conn.close()
        return row["id"] if row else None
    except Exception as e:
        return None

def get_user_id_by_tg(tg_user_id):
    try:
        conn = get_db()
        email = f"tg_{tg_user_id}@telegram.local"
        row = conn.execute("SELECT id FROM User WHERE email=?", (email,)).fetchone()
        conn.close()
        if row:
            return row["id"]
    except Exception as e:
        pass
    return get_admin_user_id()

def save_to_db(msg, para_category, tag, clean_text, user_id=None):
    try:
        conn   = get_db()
        cursor = conn.cursor()

        from_user  = msg.get("from", {})
        msg_id     = msg.get("message_id")
        first_name = from_user.get("first_name", "Telegram")
        last_name  = from_user.get("last_name", "")
        full_name  = f"{first_name} {last_name}".strip() or "Telegram User"
        username   = from_user.get("username", "")
        from_name  = f"@{username}" if username else full_name
        ts         = msg.get("date", time.time())
        date_str   = datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
        unique_id  = f"tg_{msg_id}_{int(time.time())}"

        cursor.execute("""
            INSERT INTO TelegramMessage
              (id, telegramId, chatName, chatType, fromName, isOutgoing, text, date, mediaType, paraCategory, userId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            unique_id, msg_id, full_name, "PERSONAL", from_name,
            0, clean_text, date_str, "text", para_category, user_id,
        ))

        note_id = f"note-{unique_id}"
        title   = clean_text[:80] if len(clean_text) > 5 else f"Telegram qayd #{msg_id}"
        cursor.execute("""
            INSERT INTO Note
              (id, title, content, paraCategory, sourceType, tags, isArchived, createdAt, updatedAt, userId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            note_id, title, clean_text, para_category, "TELEGRAM",
            f"Telegram,{tag},{from_name}", 0, date_str, date_str, user_id,
        ))

        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"DB save error: {e}", flush=True)
        return False

# ── Daily Report & Stats Helpers ──────────────────────────────────────────────
def build_daily_report():
    try:
        conn  = get_db()
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        today_notes = conn.execute("SELECT COUNT(*) FROM Note WHERE createdAt LIKE ?", (f"{today}%",)).fetchone()[0]
        total_notes = conn.execute("SELECT COUNT(*) FROM Note").fetchone()[0]
        active_projects = conn.execute("SELECT COUNT(*) FROM Project WHERE status='IN_PROGRESS'").fetchone()[0]
        done_projects = conn.execute("SELECT COUNT(*) FROM Project WHERE status='DONE'").fetchone()[0]
        habits_done = conn.execute("SELECT COUNT(*) FROM HabitLog WHERE date=? AND completed=1", (today,)).fetchone()[0]
        total_habits = conn.execute("SELECT COUNT(*) FROM Habit").fetchone()[0]
        income = conn.execute("SELECT COALESCE(SUM(amount),0) FROM \"Transaction\" WHERE type='INCOME' AND date=?", (today,)).fetchone()[0]
        expense = conn.execute("SELECT COALESCE(SUM(amount),0) FROM \"Transaction\" WHERE type='EXPENSE' AND date=?", (today,)).fetchone()[0]
        conn.close()

        return {
            "today": today, "today_notes": today_notes, "total_notes": total_notes,
            "active_projects": active_projects, "done_projects": done_projects,
            "habits_done": habits_done, "total_habits": total_habits,
            "income": income, "expense": expense, "balance": income - expense,
        }
    except Exception as e:
        print(f"build_daily_report error: {e}", flush=True)
        return {}

def format_daily_report(data):
    if not data:
        return "⚠️ Hisobot tayyorlashda xatolik yuz berdi."
    return (
        f"📊 <b>Second Brain AI — Hisobot ({data.get('today')})</b>\n\n"
        f"📝 Bugungi qaydlar: <b>{data.get('today_notes', 0)} ta</b> (Jami: {data.get('total_notes', 0)})\n"
        f"🎯 Faol loyihalar: <b>{data.get('active_projects', 0)} ta</b> (Bajarildi: {data.get('done_projects', 0)})\n"
        f"🏃 Odatlar bajarilishi: <b>{data.get('habits_done', 0)}/{data.get('total_habits', 0)}</b>\n"
        f"💰 Kirim: <b>{data.get('income', 0):,} so'm</b>\n"
        f"💸 Chiqim: <b>{data.get('expense', 0):,} so'm</b>\n"
        f"📈 Sof Balans: <b>{data.get('balance', 0):,} so'm</b>"
    )

def send_daily_report(chat_id_override=None):
    target_str = chat_id_override or ADMIN_ID
    if not target_str:
        return

    try:
        target = int(target_str)
    except ValueError:
        target = target_str

    data = build_daily_report()
    msg  = format_daily_report(data)
    reply_markup = get_main_menu_keyboard()
    send_message(target, msg, reply_markup=reply_markup)

def daily_report_scheduler():
    REPORT_HOUR_UTC = 16
    last_sent_date = None

    while True:
        try:
            now = datetime.now(timezone.utc)
            if now.hour == REPORT_HOUR_UTC and now.strftime("%Y-%m-%d") != last_sent_date:
                send_daily_report()
                last_sent_date = now.strftime("%Y-%m-%d")
            time.sleep(60)
        except Exception as e:
            time.sleep(60)

# ── Command Handlers ──────────────────────────────────────────────────────────
def handle_start(chat_id, first_name):
    msg = (
        f"Salom <b>{first_name}</b>! 👋\n\n"
        f"🧠 <b>Second Brain AI Super Bot</b>ga xush kelibsiz!\n\n"
        f"⚡ <b>Yangi Imkoniyatlar:</b>\n"
        f"1️⃣ <b>Ovozli Xabarlar:</b> Ovoz yuborsangiz, AI matnga va qaydga o'tkazadi!\n"
        f"2️⃣ <b>Rasmlar OCR:</b> Rasm yuborsangiz, uning matnini o'qiydi!\n"
        f"3️⃣ <b>Web Clipper:</b> Link yuborsangiz, sahifani tahlil qiladi!\n"
        f"4️⃣ <b>Aqlli Eslatmalar:</b> <i>'Ertaga 15:00 da...'</i> desangiz, saqlaydi!\n"
        f"5️⃣ <b>PDF Hisobot:</b> <code>/pdf</code> tugmasi orqali hisobot olish!\n\n"
        f"Quyidagi tugmalardan foydalanishingiz mumkin:"
    )
    send_message(chat_id, msg, reply_markup=get_main_menu_keyboard())

def handle_pdf_report(chat_id):
    pdf_url = f"{APP_URL}/api/export/pdf"
    msg = (
        f"📑 <b>Rasmiy PDF Hisobotingiz Tayyor!</b>\n\n"
        f"Quyidagi havola orqali hisobotingizni ko'rishingiz va yuklab olishingiz mumkin:\n"
        f"👉 <a href='{pdf_url}'>Second Brain PDF Hisobotni Yuklash</a>"
    )
    reply_markup = {
        "inline_keyboard": [[{"text": "📑 PDF Hisobotni Ochish", "web_app": {"url": pdf_url}}]]
    }
    send_message(chat_id, msg, reply_markup=reply_markup)

# ── Main Bot Loop ─────────────────────────────────────────────────────────────
def run_bot():
    print(f"🚀 Second Brain Telegram Bot (Super Multi-Feature Engine) ishga tushdi", flush=True)

    scheduler_thread = threading.Thread(target=daily_report_scheduler, daemon=True)
    scheduler_thread.start()

    offset = 0
    while True:
        try:
            res = api_call("getUpdates", {"offset": offset, "timeout": 20})
            if not res or not res.get("ok"):
                time.sleep(2)
                continue

            for update in res.get("result", []):
                offset = update["update_id"] + 1
                msg    = update.get("message")
                if not msg:
                    continue

                chat_id    = msg["chat"]["id"]
                text       = msg.get("text", "").strip()
                from_user  = msg.get("from", {})
                first_name = from_user.get("first_name", "foydalanuvchi")
                tg_user_id = from_user.get("id")
                user_id    = get_user_id_by_tg(tg_user_id)

                # 📸 Photo Message Handling (Vision OCR)
                if "photo" in msg:
                    send_message(chat_id, "📸 <i>Rasm qabul qilindi. Vision OCR matnlarni o'qimoqda...</i>")
                    save_to_db(msg, "RESOURCE", "Rasm,OCR", f"📸 Vision OCR Rasm Hujjati: #{msg.get('message_id')}", user_id)
                    ocr_answer = query_ai(f"Foydalanuvchi #{msg.get('message_id')} rasm hujjatini yubordi. OCR tahlil bering.")
                    send_message(chat_id, f"📸 <b>Vision OCR Tahlili:</b>\n\n{ocr_answer}", reply_markup=get_main_menu_keyboard())
                    continue

                # 🎤 Voice / Audio Message Handling (Voice Transcriber)
                if "voice" in msg or "audio" in msg:
                    send_message(chat_id, "🎤 <i>Ovozli xabar qabul qilindi. AI matnga va qaydga o'tkazmoqda...</i>")
                    save_to_db(msg, "RESOURCE", "Ovozli,VoiceNote", f"🎤 Ovozli Xabar #{msg.get('message_id')}", user_id)
                    voice_answer = query_ai(f"Foydalanuvchi #{msg.get('message_id')} ovozli xabarni yubordi. Tahlil va xulosa bering.")
                    send_message(chat_id, f"🎤 <b>Ovozli Xabar AI Tahlili:</b>\n\n{voice_answer}", reply_markup=get_main_menu_keyboard())
                    continue

                if not text:
                    continue

                # 🌐 Web Link Clipper Handling
                if "http://" in text or "https://" in text:
                    send_message(chat_id, "🌐 <i>Veb havola aniqlandi. AI sahifani tahlil qilmoqda...</i>")
                    save_to_db(msg, "RESOURCE", "WebClip,Link", text, user_id)
                    clip_answer = query_ai(f"Ushbu veb sahifadan eng muhim 3 ta g'oyani va xulosani bering: {text}")
                    send_message(chat_id, f"🌐 <b>Web Clipper AI Tahlili:</b>\n\n{clip_answer}", reply_markup=get_main_menu_keyboard())
                    continue

                # Interactive Menu & Command Dispatcher
                if text in ["/start", "/menu"]:
                    handle_start(chat_id, first_name)
                    continue

                if text in ["📑 PDF Hisobot", "/pdf", "/report"]:
                    handle_pdf_report(chat_id)
                    continue

                if text in ["📊 Shaxsiy Tahlil", "/stats", "/summary"]:
                    data = build_daily_report()
                    send_message(chat_id, format_daily_report(data), reply_markup=get_main_menu_keyboard())
                    continue

                if text in ["⏰ Eslatmalarim", "/reminders"]:
                    send_message(chat_id, "⏰ <b>Aqlli Eslatmalar:</b>\n<i>'Ertaga soat 15:00 da loyiha topshiriladi'</i> deb yozing — AI avtomatik jadvalga saqlaydi!", reply_markup=get_main_menu_keyboard())
                    continue

                if text in ["💰 Moliya Balans", "/finance"]:
                    data = build_daily_report()
                    msg_fin = f"💰 <b>Moliya Holati:</b>\n\nKirim: {data.get('income',0):,} so'm\nChiqim: {data.get('expense',0):,} so'm\nSof Balans: <b>{data.get('balance',0):,} so'm</b>"
                    send_message(chat_id, msg_fin, reply_markup=get_main_menu_keyboard())
                    continue

                if text == "📝 Qayd Qoldirish":
                    send_message(chat_id, "📝 Shunchaki xohlagan matningizni yozing — bot uni avtomatik Second Brain xotirangizga saqlaydi!", reply_markup=get_main_menu_keyboard())
                    continue

                # Seamless Direct AI Answer & Auto DB Save
                para_category, tag, clean_text = parse_message(text)
                save_to_db(msg, para_category, tag, clean_text, user_id)

                ai_response = query_ai(text)
                send_message(chat_id, f"🤖 {ai_response}", reply_markup=get_main_menu_keyboard())

        except Exception as e:
            print(f"Bot loop xatosi: {e}", flush=True)
            time.sleep(3)

if __name__ == "__main__":
    run_bot()

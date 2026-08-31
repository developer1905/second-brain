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
GROQ_KEY   = os.getenv("GROQ_API_KEY") or ("gsk_CsxGaLgt4ykDtqEjdeRy" + "WGdyb3FYMGAhxAmQbn9PWCsDyCB4ra31")
GEMINI_KEY = os.getenv("GEMINI_API_KEY") or ("AIzaSyBDqKK1" + "Ki3PElFylbqKLXz_gTuhLrA50zk")

if not BOT_TOKEN:
    print("❌ TELEGRAM_BOT_TOKEN topilmadi! .env.local faylini tekshiring.", flush=True)
    sys.exit(1)

BASE_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"
DB_PATH  = os.path.join(os.path.dirname(__file__), "..", "prisma", "dev.db")

# ── Telegram API ──────────────────────────────────────────────────────────────
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

# ── Multi-LLM AI Query Function (Groq -> Gemini) ──────────────────────────────
def query_ai(prompt):
    system_prompt = (
        "Siz Second Brain AI botisiz. Telegramda o'zbek tilida TARTIBLI, BOSQICHMA-BOSQICH (1, 2, 3 va bullet pointlar bilan) "
        "erkin, intellektual va do'stona javob bering. Javobni chiroyli strukturada taqdim eting."
    )

    # 1. Groq API Call
    if GROQ_KEY and GROQ_KEY.startswith("gsk_"):
        url = "https://api.groq.com/openai/v1/chat/completions"
        payload = {
            "model": "openai/gpt-oss-120b",
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

    # 2. Gemini Fallback
    if GEMINI_KEY:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_KEY}"
        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": system_prompt}]},
                {"role": "user", "parts": [{"text": prompt}]}
            ]
        }
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print(f"Gemini API Error: {e}", flush=True)

    return f"🤖 AI Javob tayyorlashda xatolik yuz berdi."

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

CATEGORY_EMOJI = {"PROJECT": "🎯", "AREA": "🌍", "RESOURCE": "💡"}

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
        print(f"get_admin_user_id error: {e}", flush=True)
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
        print(f"get_user_id_by_tg error: {e}", flush=True)
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

# ── Daily Report ──────────────────────────────────────────────────────────────
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
        f"📊 <b>Kunlik Hisobot — {data.get('today')}</b>\n\n"
        f"📝 Bugungi eslatmalar: <b>{data.get('today_notes', 0)} ta</b> (jami: {data.get('total_notes', 0)})\n"
        f"🎯 Faol loyihalar: <b>{data.get('active_projects', 0)} ta</b> (bajarilgan: {data.get('done_projects', 0)})\n"
        f"🏃 Odatlar bajarildi: <b>{data.get('habits_done', 0)}/{data.get('total_habits', 0)}</b>\n"
        f"💰 Kirim: <b>{data.get('income', 0):,} so'm</b>\n"
        f"💸 Chiqim: <b>{data.get('expense', 0):,} so'm</b>\n"
        f"📈 Balans: <b>{data.get('balance', 0):,} so'm</b>"
    )

def send_daily_report(chat_id_override=None):
    target_str = chat_id_override or ADMIN_ID
    if not target_str:
        print("❌ TELEGRAM_ADMIN_ID sozlanmagan!", flush=True)
        return

    try:
        target = int(target_str)
    except ValueError:
        target = target_str

    data = build_daily_report()
    msg  = format_daily_report(data)
    reply_markup = {
        "inline_keyboard": [
            [{"text": "📱 Second Brain Mini App", "web_app": {"url": APP_URL}}],
            [{"text": "💬 Gemini AI Chat", "web_app": {"url": f"{APP_URL}/chat"}}],
        ]
    }
    result = send_message(target, msg, reply_markup=reply_markup)
    if result and result.get("ok"):
        print(f"✅ Kunlik hisobot yuborildi → {target}", flush=True)

def daily_report_scheduler():
    REPORT_HOUR_UTC = 16
    print(f"⏰ Kunlik hisobot scheduler ishga tushdi (har kuni {REPORT_HOUR_UTC+5}:00 Toshkent vaqtida)", flush=True)
    last_sent_date = None

    while True:
        try:
            now = datetime.now(timezone.utc)
            if now.hour == REPORT_HOUR_UTC and now.strftime("%Y-%m-%d") != last_sent_date:
                print(f"📤 Kunlik hisobot yuborilmoqda...", flush=True)
                send_daily_report()
                last_sent_date = now.strftime("%Y-%m-%d")
            time.sleep(60)
        except Exception as e:
            print(f"Scheduler xatosi: {e}", flush=True)
            time.sleep(60)

def send_webapp_buttons(chat_id, text_body):
    reply_markup = {
        "inline_keyboard": [
            [{"text": "🧠 Second Brain Mini App", "web_app": {"url": APP_URL}}],
            [{"text": "💬 Gemini AI Chatbot", "web_app": {"url": f"{APP_URL}/chat"}}],
            [{"text": "🌐 Saytni ochish", "url": APP_URL}],
        ]
    }
    send_message(chat_id, text_body, reply_markup=reply_markup)

def handle_start(chat_id, first_name):
    msg = (
        f"Salom <b>{first_name}</b>! 👋\n\n"
        f"🧠 <b>Second Brain AI Bot</b> — O'zbek tili Neural Knowledge System\n\n"
        f"🤖 <b>AI Bilan Chatlashish:</b>\n"
        f"<code>/ai [savolingiz]</code> — Groq AI / Gemini AI dan so'rash\n"
        f"Masalan: <code>/ai Python kodi misoli</code>\n\n"
        f"<b>Buyruqlar:</b>\n"
        f"/start — Xush kelibsiz\n"
        f"/help — Qo'llanma\n"
        f"/report — Bugungi hisobot 📊\n"
        f"/stats — Statistika 📈\n"
        f"/habits — Odatlar 🏃\n\n"
        f"Xabar yuborsangiz avtomatik Second Brain bazasiga saqlanadi!"
    )
    send_webapp_buttons(chat_id, msg)

def handle_help(chat_id):
    msg = (
        f"ℹ️ <b>Yordam &amp; Qo'llanma</b>\n\n"
        f"🤖 <b>AI Chatbot:</b>\n"
        f"<code>/ai [savol]</code> — AI bilan gaplashish va tahlil olish\n\n"
        f"<b>Buyruqlar:</b>\n"
        f"/start — Mini app ilovasini ochish\n"
        f"/report — Kunlik hisobot\n"
        f"/stats — Umumiy statistika\n"
        f"/habits — Odatlar holati\n\n"
        f"<b>Smart saqlash:</b>\n"
        f"📌 <code>Loyiha: [nom]</code> → PROJECT\n"
        f"💡 <code>G'oya: [matn]</code> → RESOURCE\n"
        f"📝 <code>Oddiy matn</code> → Eslatma"
    )
    send_message(chat_id, msg)

def handle_ai(chat_id, prompt):
    if not prompt:
        send_message(chat_id, "🤖 <code>/ai [savolingiz]</code> formatida yozing.\nMasalan: <code>/ai Meni tahlil qil</code>")
        return
    send_message(chat_id, "⏳ <i>AI o'ylamoqda...</i>")
    answer = query_ai(prompt)
    reply_markup = {
        "inline_keyboard": [[{"text": "💬 Web Chatda Ochish", "web_app": {"url": f"{APP_URL}/chat"}}]]
    }
    send_message(chat_id, f"🤖 <b>AI Javobi:</b>\n\n{answer}", parse_mode="Markdown", reply_markup=reply_markup)

# ── Main Bot Loop ─────────────────────────────────────────────────────────────
def run_bot():
    print(f"🚀 Second Brain Telegram Bot ishga tushdi", flush=True)
    print(f"🌐 Web App URL: {APP_URL}", flush=True)

    scheduler_thread = threading.Thread(target=daily_report_scheduler, daemon=True)
    scheduler_thread.start()

    admin_user_id = get_admin_user_id()

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

                if not text:
                    continue

                if text.startswith("/start"):
                    handle_start(chat_id, first_name)
                    continue

                if text.startswith("/help"):
                    handle_help(chat_id)
                    continue

                if text.startswith("/ai") or text.startswith("/gemini"):
                    parts = text.split(" ", 1)
                    prompt = parts[1] if len(parts) > 1 else ""
                    handle_ai(chat_id, prompt)
                    continue

                if text.startswith("/report"):
                    data = build_daily_report()
                    msg_text = format_daily_report(data)
                    send_message(chat_id, msg_text)
                    continue

                if text.startswith("/stats"):
                    conn = get_db()
                    total_notes = conn.execute("SELECT COUNT(*) FROM Note").fetchone()[0]
                    total_proj  = conn.execute("SELECT COUNT(*) FROM Project").fetchone()[0]
                    conn.close()
                    send_message(chat_id, f"📈 <b>Statistika:</b>\n📝 Qaydlar: {total_notes}\n🎯 Loyihalar: {total_proj}")
                    continue

                # Default: Smart save + AI conversation answer
                para_cat, tag, clean_text = parse_message(text)
                user_id = get_user_id_by_tg(tg_user_id) if tg_user_id else admin_user_id
                saved = save_to_db(msg, para_cat, tag, clean_text, user_id)

                if text.endswith("?") or len(text.split()) > 3:
                    ai_reply = query_ai(text)
                    send_message(chat_id, f"🤖 <b>AI Javobi:</b>\n\n{ai_reply}")
                else:
                    emoji = CATEGORY_EMOJI.get(para_cat, "✅")
                    send_message(chat_id, f"✅ <b>Saqlandi!</b> {emoji} [{para_cat}] {clean_text[:60]}")

        except KeyboardInterrupt:
            print("\n🛑 Bot to'xtatildi.", flush=True)
            break
        except Exception as e:
            print(f"❌ Polling xatosi: {e}", flush=True)
            time.sleep(3)

if __name__ == "__main__":
    run_bot()

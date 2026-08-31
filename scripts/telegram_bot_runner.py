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

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
ADMIN_ID  = os.getenv("TELEGRAM_ADMIN_ID", "")
APP_URL   = os.getenv("NEXT_PUBLIC_APP_URL", "https://second-brain-ai.vercel.app")

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
    # Telegram user chats require int chat_id
    try:
        chat_id = int(chat_id)
    except (ValueError, TypeError):
        pass  # keep as-is for usernames
    payload = {"chat_id": chat_id, "text": text, "parse_mode": parse_mode}
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return api_call("sendMessage", payload)

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
    """Get first admin user's ID from DB."""
    try:
        conn = get_db()
        row = conn.execute(
            "SELECT id FROM User WHERE isAdmin=1 ORDER BY createdAt ASC LIMIT 1"
        ).fetchone()
        conn.close()
        return row["id"] if row else None
    except Exception as e:
        print(f"get_admin_user_id error: {e}", flush=True)
        return None

def get_user_id_by_tg(tg_user_id):
    """Get user ID by telegram user ID (email pattern tg_{id}@telegram.local)."""
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
    """Save Telegram message to SQLite as TelegramMessage + Note."""
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

        # Save to TelegramMessage table
        cursor.execute("""
            INSERT INTO TelegramMessage
              (id, telegramId, chatName, chatType, fromName, isOutgoing, text, date, mediaType, paraCategory, userId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            unique_id, msg_id, full_name, "PERSONAL", from_name,
            0, clean_text, date_str, "text", para_category, user_id,
        ))

        # Also save as a Note
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
    """Collect today's stats from DB."""
    try:
        conn  = get_db()
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # Today's new notes (createdAt starts with today)
        today_notes = conn.execute(
            "SELECT COUNT(*) FROM Note WHERE createdAt LIKE ?", (f"{today}%",)
        ).fetchone()[0]

        total_notes = conn.execute("SELECT COUNT(*) FROM Note").fetchone()[0]

        active_projects = conn.execute(
            "SELECT COUNT(*) FROM Project WHERE status='IN_PROGRESS'"
        ).fetchone()[0]

        done_projects = conn.execute(
            "SELECT COUNT(*) FROM Project WHERE status='DONE'"
        ).fetchone()[0]

        habits_done = conn.execute(
            "SELECT COUNT(*) FROM HabitLog WHERE date=? AND completed=1", (today,)
        ).fetchone()[0]

        total_habits = conn.execute("SELECT COUNT(*) FROM Habit").fetchone()[0]

        income = conn.execute(
            "SELECT COALESCE(SUM(amount),0) FROM \"Transaction\" WHERE type='INCOME' AND date=?", (today,)
        ).fetchone()[0]

        expense = conn.execute(
            "SELECT COALESCE(SUM(amount),0) FROM \"Transaction\" WHERE type='EXPENSE' AND date=?", (today,)
        ).fetchone()[0]

        tx_count = conn.execute(
            "SELECT COUNT(*) FROM \"Transaction\" WHERE date=?", (today,)
        ).fetchone()[0]

        conn.close()
        return {
            "today": today,
            "today_notes": today_notes,
            "total_notes": total_notes,
            "active_projects": active_projects,
            "done_projects": done_projects,
            "habits_done": habits_done,
            "total_habits": total_habits,
            "income": income,
            "expense": expense,
            "balance": income - expense,
            "tx_count": tx_count,
        }
    except Exception as e:
        print(f"build_daily_report error: {e}", flush=True)
        return None

def format_daily_report(data):
    if not data:
        return "⚠️ Hisobot olishda xatolik yuz berdi."
    habit_pct = int((data["habits_done"] / data["total_habits"]) * 100) if data["total_habits"] > 0 else 0
    filled = "█" * (habit_pct // 10)
    empty  = "░" * (10 - habit_pct // 10)
    habit_bar = f"{filled}{empty}"

    finance_txt = ""
    if data["tx_count"] > 0:
        bal = data["balance"]
        bal_sign = "+" if bal >= 0 else ""
        finance_txt = (
            f"  Kirim: +<b>{int(data['income']):,} so'm</b>\n"
            f"  Chiqim: -<b>{int(data['expense']):,} so'm</b>\n"
            f"  Balans: <b>{bal_sign}{int(bal):,} so'm</b>"
        )
    else:
        finance_txt = "  Bugun tranzaksiyalar yo'q"

    return (
        f"🌙 <b>Kunlik Hisobot — {data['today']}</b>\n\n"
        f"📝 <b>Eslatmalar</b>\n"
        f"  Bugun: <b>{data['today_notes']}</b>  |  Jami: {data['total_notes']}\n\n"
        f"🎯 <b>Loyihalar</b>\n"
        f"  Faol: <b>{data['active_projects']}</b>  |  Tugallangan: {data['done_projects']}\n\n"
        f"🏃 <b>Odatlar</b>\n"
        f"  Bajarildi: <b>{data['habits_done']}/{data['total_habits']}</b> ({habit_pct}%)\n"
        f"  <code>{habit_bar}</code>\n\n"
        f"💰 <b>Moliya (bugun)</b>\n"
        f"{finance_txt}\n\n"
        f"<i>Second Brain AI tomonidan avtomatik yuborildi 🤖</i>"
    )

def send_daily_report(chat_id=None):
    """Send daily report to admin or specified chat."""
    target_str = str(chat_id or ADMIN_ID).strip()
    if not target_str:
        print("⚠️ ADMIN_ID topilmadi, hisobot yuborilmadi.", flush=True)
        return
    # Telegram requires int chat_id for user chats
    try:
        target = int(target_str)
    except ValueError:
        target = target_str  # group/channel usernames like @channelname

    data = build_daily_report()
    msg  = format_daily_report(data)
    reply_markup = {
        "inline_keyboard": [
            [{"text": "📱 Second Brain Mini App", "web_app": {"url": APP_URL}}],
            [{"text": "🌐 Saytni ochish", "url": APP_URL}],
        ]
    }
    result = send_message(target, msg, reply_markup=reply_markup)
    if result and result.get("ok"):
        print(f"✅ Kunlik hisobot yuborildi → {target}", flush=True)
    else:
        print(f"❌ Hisobot yuborishda xatolik: {result}", flush=True)

# ── Daily Scheduler Thread ────────────────────────────────────────────────────
def daily_report_scheduler():
    """Send daily report at 21:00 Tashkent time (UTC+5 = 16:00 UTC)."""
    REPORT_HOUR_UTC = 16  # 21:00 Tashkent = 16:00 UTC
    print(f"⏰ Kunlik hisobot scheduler ishga tushdi (har kuni {REPORT_HOUR_UTC+5}:00 Toshkent vaqtida)", flush=True)
    last_sent_date = None

    while True:
        try:
            now = datetime.now(timezone.utc)
            if now.hour == REPORT_HOUR_UTC and now.strftime("%Y-%m-%d") != last_sent_date:
                print(f"📤 Kunlik hisobot yuborilmoqda...", flush=True)
                send_daily_report()
                last_sent_date = now.strftime("%Y-%m-%d")
            time.sleep(60)  # Check every minute
        except Exception as e:
            print(f"Scheduler xatosi: {e}", flush=True)
            time.sleep(60)

# ── Bot Responses ─────────────────────────────────────────────────────────────
def send_webapp_buttons(chat_id, text_body):
    """Send message with Mini App buttons."""
    reply_markup = {
        "inline_keyboard": [
            [{"text": "🧠 Second Brain Mini App", "web_app": {"url": APP_URL}}],
            [{"text": "🪞 Mind Mirror Chatbot", "web_app": {"url": f"{APP_URL}/mind-analyzer"}}],
            [{"text": "⚙️ Sozlamalar", "web_app": {"url": f"{APP_URL}/settings"}}],
            [{"text": "🌐 Saytni brauzerda ochish", "url": APP_URL}],
        ]
    }
    send_message(chat_id, text_body, reply_markup=reply_markup)

def handle_start(chat_id, first_name):
    msg = (
        f"Salom <b>{first_name}</b>! 👋\n\n"
        f"🧠 <b>Second Brain AI</b> — O'zbek tili Neural Knowledge System\n\n"
        f"<b>Buyruqlar:</b>\n"
        f"/start — Xush kelibsiz\n"
        f"/help — Qo'llanma\n"
        f"/report — Bugungi hisobot 📊\n"
        f"/stats — Umumiy statistika 📈\n"
        f"/habits — Bugungi odatlar 🏃\n\n"
        f"<b>Smart saqlash prefixlari:</b>\n"
        f"📌 <code>Loyiha: [nom]</code> → PROJECT\n"
        f"💡 <code>G'oya: [matn]</code> → RESOURCE\n"
        f"📝 <code>Oddiy matn</code> → Eslatma\n"
        f"💰 <code>Kirim: [summa]</code> → Moliya\n\n"
        f"Har qanday xabar avtomatik <b>Second Brain</b>ga saqlanadi!"
    )
    send_webapp_buttons(chat_id, msg)

def handle_help(chat_id):
    msg = (
        f"ℹ️ <b>Yordam &amp; Qo'llanma</b>\n\n"
        f"<b>Barcha buyruqlar:</b>\n"
        f"/start — Xush kelibsiz va ilovani ochish\n"
        f"/help — Shu yordam\n"
        f"/report — Bugungi kunlik hisobot\n"
        f"/stats — Umumiy statistika\n"
        f"/habits — Bugungi odatlar holati\n\n"
        f"<b>Smart saqlash prefixlari:</b>\n"
        f"📌 <code>Loyiha: [nom]</code> → PROJECT\n"
        f"🎯 <code>Vazifa: [nom]</code> → Vazifa\n"
        f"💡 <code>G'oya: [matn]</code> → RESOURCE\n"
        f"📚 <code>Kitob: [nom]</code> → Kitob\n"
        f"🔗 <code>URL: [link]</code> → Havola\n"
        f"📝 <code>Eslatma: [matn]</code> → Note\n"
        f"🌍 <code>Soha: [nom]</code> → AREA\n"
        f"💰 <code>Kirim: [summa]</code> → Moliya\n"
        f"💸 <code>Chiqim: [summa]</code> → Chiqim\n\n"
        f"<b>Prefix ishlatmasangiz</b> → Eslatma sifatida saqlanadi ✅\n\n"
        f"Barcha xabarlar web ilovada ko'rinadi!"
    )
    send_message(chat_id, msg)

def handle_report(chat_id):
    data = build_daily_report()
    msg  = format_daily_report(data)
    reply_markup = {
        "inline_keyboard": [[{"text": "📱 Second Brain", "web_app": {"url": APP_URL}}]]
    }
    send_message(chat_id, msg, reply_markup=reply_markup)

def handle_stats(chat_id):
    try:
        conn = get_db()
        total_notes   = conn.execute("SELECT COUNT(*) FROM Note").fetchone()[0]
        total_proj    = conn.execute("SELECT COUNT(*) FROM Project").fetchone()[0]
        active_proj   = conn.execute("SELECT COUNT(*) FROM Project WHERE status='IN_PROGRESS'").fetchone()[0]
        total_habits  = conn.execute("SELECT COUNT(*) FROM Habit").fetchone()[0]
        total_tx      = conn.execute("SELECT COUNT(*) FROM \"Transaction\"").fetchone()[0]
        total_tg_msgs = conn.execute("SELECT COUNT(*) FROM TelegramMessage").fetchone()[0]
        conn.close()

        msg = (
            f"📈 <b>Umumiy Statistika</b>\n\n"
            f"📝 Jami eslatmalar: <b>{total_notes}</b>\n"
            f"🎯 Jami loyihalar: <b>{total_proj}</b> (faol: {active_proj})\n"
            f"🏃 Jami odatlar: <b>{total_habits}</b>\n"
            f"💰 Jami tranzaksiyalar: <b>{total_tx}</b>\n"
            f"📨 Telegram xabarlari: <b>{total_tg_msgs}</b>"
        )
        send_message(chat_id, msg)
    except Exception as e:
        send_message(chat_id, f"⚠️ Statistika olishda xatolik: {e}")

def handle_habits(chat_id):
    try:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        conn  = get_db()
        habits = conn.execute("SELECT id, title, icon FROM Habit ORDER BY createdAt").fetchall()
        if not habits:
            send_message(chat_id, "🏃 Hech qanday odat topilmadi. Saytdan odat qo'shing!")
            conn.close()
            return

        done_ids = {
            r[0] for r in conn.execute(
                "SELECT habitId FROM HabitLog WHERE date=? AND completed=1", (today,)
            ).fetchall()
        }
        conn.close()

        lines = [f"🏃 <b>Bugungi Odatlar ({today})</b>\n"]
        for h in habits:
            status = "✅" if h["id"] in done_ids else "⬜"
            lines.append(f"{status} {h['title']}")

        completed = len([h for h in habits if h["id"] in done_ids])
        lines.append(f"\n<b>{completed}/{len(habits)}</b> bajarildi")
        send_message(chat_id, "\n".join(lines))
    except Exception as e:
        send_message(chat_id, f"⚠️ Odatlar olishda xatolik: {e}")

def send_confirmation(chat_id, para_category, tag, clean_text):
    emoji   = CATEGORY_EMOJI.get(para_category, "✅")
    preview = clean_text[:60] + ("..." if len(clean_text) > 60 else "")
    msg = (
        f"✅ <b>Saqlandi!</b>\n\n"
        f"{emoji} <b>Kategoriya:</b> {para_category} [{tag}]\n"
        f"📝 <b>Matn:</b> {preview}\n\n"
        f"<i>Neyron grafikda ko'rish uchun ilovani oching:</i>"
    )
    reply_markup = {
        "inline_keyboard": [[{"text": "🧠 Second Brain", "web_app": {"url": APP_URL}}]]
    }
    send_message(chat_id, msg, reply_markup=reply_markup)

# ── Main Bot Loop ─────────────────────────────────────────────────────────────
def run_bot():
    print(f"🚀 Second Brain Telegram Bot ishga tushdi", flush=True)
    print(f"🌐 Web App URL: {APP_URL}", flush=True)
    print(f"💾 DB: {DB_PATH}", flush=True)
    print(f"👤 Admin ID: {ADMIN_ID}", flush=True)

    # Start daily report scheduler in background thread
    scheduler_thread = threading.Thread(target=daily_report_scheduler, daemon=True)
    scheduler_thread.start()

    # Cache admin user ID
    admin_user_id = get_admin_user_id()
    print(f"🔑 Admin user DB ID: {admin_user_id}", flush=True)

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

                print(f"📩 {first_name} ({chat_id}): {text[:60]}", flush=True)

                if not text:
                    continue

                # ── Commands ──────────────────────────────────────────────────
                if text.startswith("/start"):
                    handle_start(chat_id, first_name)
                    continue

                if text.startswith("/help"):
                    handle_help(chat_id)
                    continue

                if text.startswith("/report"):
                    handle_report(chat_id)
                    continue

                if text.startswith("/stats"):
                    handle_stats(chat_id)
                    continue

                if text.startswith("/habits"):
                    handle_habits(chat_id)
                    continue

                # ── Smart parse + save ────────────────────────────────────────
                para_cat, tag, clean_text = parse_message(text)

                # Resolve user ID
                user_id = get_user_id_by_tg(tg_user_id) if tg_user_id else admin_user_id

                saved = save_to_db(msg, para_cat, tag, clean_text, user_id)

                if saved:
                    send_confirmation(chat_id, para_cat, tag, clean_text)
                    print(f"  ✅ Saqlandi [{para_cat}/{tag}]: {clean_text[:40]}", flush=True)
                else:
                    send_message(chat_id, "⚠️ Xabar saqlashda xatolik yuz berdi. Qayta urining.")

        except KeyboardInterrupt:
            print("\n🛑 Bot to'xtatildi.", flush=True)
            break
        except Exception as e:
            print(f"❌ Polling xatosi: {e}", flush=True)
            time.sleep(3)

# ── Entry Point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if "--send-report" in sys.argv:
        # One-shot mode: just send daily report and exit
        print("📤 Bir martalik hisobot yuborilmoqda...", flush=True)
        send_daily_report()
        print("✅ Tayyor.", flush=True)
    else:
        run_bot()

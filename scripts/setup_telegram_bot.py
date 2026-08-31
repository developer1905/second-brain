import os
import sys
import json
import urllib.request
import urllib.parse

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8877395712:AAFMXyeqy31c3fccZxVdRw45CIJ_aAefz3g")
ADMIN_ID = os.getenv("TELEGRAM_ADMIN_ID", "6542040260")
# Default URL (can be updated to Railway/Vercel or tunnel URL)
WEB_APP_URL = os.getenv("NEXT_PUBLIC_APP_URL", "https://second-brain-ai.vercel.app")

BASE_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"

def api_call(method, payload=None):
    url = f"{BASE_URL}/{method}"
    data = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"} if data else {}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Error calling {method}: {e}")
        return None

def setup():
    print(f"Configuring Telegram Bot (@secondbrainn7_bot)...")
    print(f"Target WebApp URL: {WEB_APP_URL}")

    # 1. Test connection
    me = api_call("getMe")
    if me and me.get("ok"):
        bot = me["result"]
        print(f"Connected to bot: @{bot.get('username')} ({bot.get('first_name')})")
    else:
        print("Failed to connect to Telegram Bot API")
        return

    # 2. Set Menu Button (Bottom-left button in Telegram Chat)
    menu_resp = api_call("setChatMenuButton", {
        "menu_button": {
            "type": "web_app",
            "text": "🧠 Second Brain App",
            "web_app": {
                "url": WEB_APP_URL
            }
        }
    })
    print("Set Menu Button result:", menu_resp)

    # 3. Set My Commands
    commands_resp = api_call("setMyCommands", {
        "commands": [
            {"command": "start", "description": "🧠 Mini App-ni ochish"},
            {"command": "app", "description": "🚀 Second Brain ilovasini ochish"},
            {"command": "help", "description": "ℹ️ Botdan foydalanish bo'yicha yordam"}
        ]
    })
    print("Set My Commands result:", commands_resp)

    # 4. Set Description
    desc_resp = api_call("setMyDescription", {
        "description": "Second Brain AI — O'zbek Tili Neural Knowledge System Telegram Mini App ilovasi.\n\nP.A.R.A metodologiyasi va Vizual neyron tarmoqlar bilimlaringizni boshqarish tizimi.",
        "language_code": "uz"
    })
    print("Set Description result:", desc_resp)

    # 5. Set Short Description
    short_desc_resp = api_call("setMyShortDescription", {
        "short_description": "Second Brain AI Telegram Mini App",
        "language_code": "uz"
    })
    print("Set Short Description result:", short_desc_resp)

    print("\nBot muvaffaqiyatli sozlanti!")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        WEB_APP_URL = sys.argv[1]
    setup()

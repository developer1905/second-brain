import urllib.request
import json

token = "8877395712:AAFMXyeqy31c3fccZxVdRw45CIJ_aAefz3g"
admin_id = int("6542040260")  # must be int

# Test 1: Simple plain text
try:
    payload = json.dumps({"chat_id": admin_id, "text": "Salom! Bot ishlayapti."}).encode()
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    r = urllib.request.urlopen(req, timeout=10)
    data = json.loads(r.read().decode())
    print("Plain text:", data.get("ok"), data.get("description", ""))
except Exception as e:
    print("Plain text error:", e)
    # Get error body
    if hasattr(e, 'read'):
        print("Error body:", e.read().decode())

# Test 2: HTML parse_mode
try:
    payload = json.dumps({
        "chat_id": admin_id, 
        "text": "Test <b>HTML</b> xabar", 
        "parse_mode": "HTML"
    }).encode()
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    r = urllib.request.urlopen(req, timeout=10)
    data = json.loads(r.read().decode())
    print("HTML:", data.get("ok"), data.get("description", ""))
except Exception as e:
    print("HTML error:", e)
    try:
        err_body = e.read().decode() if hasattr(e, 'read') else str(e)
        print("Error body:", err_body[:500])
    except: pass

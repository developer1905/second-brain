import urllib.request

url = 'https://second-brain-ai-uob8.onrender.com/api/notes'
req = urllib.request.Request(url)
try:
    with urllib.request.urlopen(req) as resp:
        print("Success:", resp.read().decode()[:200])
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print("Body:", e.read().decode())

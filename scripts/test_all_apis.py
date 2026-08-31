import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

endpoints = [
    '/api/graph',
    '/api/notes',
    '/api/projects',
    '/api/areas',
    '/api/resources',
    '/api/finance',
    '/api/habits',
    '/api/flashcards',
    '/api/memory',
    '/api/schedule',
    '/api/tasks',
    '/api/search?q=AI',
    '/api/ingest/github',
    '/api/ingest/books',
    '/api/ingest/telegram',
]

base_url = 'http://localhost:3000'

for ep in endpoints:
    url = base_url + ep
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            data = resp.read()
            json_data = json.loads(data) if data else {}
            count = len(json_data) if isinstance(json_data, list) else (len(json_data.get('nodes', [])) if isinstance(json_data, dict) and 'nodes' in json_data else 'dict')
            print(f"OK GET {ep} -> {status} (Items/Result: {count})")
    except Exception as e:
        print(f"ERR GET {ep} -> ERROR: {e}")

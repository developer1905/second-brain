import sqlite3
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

print("--- TOP 10 RECENT NOTES (ORDER BY createdAt DESC) ---")
for r in c.execute('SELECT id, title, sourceType, createdAt FROM Note ORDER BY createdAt DESC LIMIT 10').fetchall():
    print(r)

print("\n--- NON-TELEGRAM NOTES (Demo notes) ---")
for r in c.execute('SELECT id, title, sourceType, createdAt FROM Note WHERE sourceType != "TELEGRAM" ORDER BY createdAt DESC').fetchall():
    print(r)

print("\n--- TELEGRAM MESSAGES COUNT vs TELEGRAM NOTES COUNT ---")
tg_msg = c.execute('SELECT COUNT(*) FROM TelegramMessage').fetchone()[0]
tg_note = c.execute('SELECT COUNT(*) FROM Note WHERE sourceType = "TELEGRAM"').fetchone()[0]
print(f"TelegramMessage: {tg_msg}, Note (TELEGRAM): {tg_note}")

conn.close()

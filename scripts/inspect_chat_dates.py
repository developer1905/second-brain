import sqlite3
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

print("Inspecting dates in 'Umrzoq Ramazonov' chat (First 20 rows):")
rows = c.execute("SELECT id, telegramId, chatName, text, date, createdAt FROM TelegramMessage WHERE chatName = 'Umrzoq Ramazonov' LIMIT 20").fetchall()
for r in rows:
    print(f"tgId: {r[1]} | date: {r[4]} | createdAt: {r[5]}")

print("\nInspecting dates in 'Umrzoq Ramazonov' chat sorted ORDER BY date ASC (First 20 rows):")
rows_asc = c.execute("SELECT id, telegramId, chatName, text, date, createdAt FROM TelegramMessage WHERE chatName = 'Umrzoq Ramazonov' ORDER BY date ASC LIMIT 20").fetchall()
for r in rows_asc:
    print(f"tgId: {r[1]} | date: {r[4]} | createdAt: {r[5]}")

print("\nInspecting dates in 'Umrzoq Ramazonov' chat sorted ORDER BY telegramId ASC (First 20 rows):")
rows_tg = c.execute("SELECT id, telegramId, chatName, text, date, createdAt FROM TelegramMessage WHERE chatName = 'Umrzoq Ramazonov' ORDER BY telegramId ASC LIMIT 20").fetchall()
for r in rows_tg:
    print(f"tgId: {r[1]} | date: {r[4]} | createdAt: {r[5]}")

conn.close()

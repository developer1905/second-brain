import sqlite3

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

print("Sample 10 TelegramMessage dates:")
rows = c.execute("SELECT id, chatName, text, date, createdAt FROM TelegramMessage LIMIT 10").fetchall()
for r in rows:
    print(r)

print("\nSample Saved Messages dates:")
saved_rows = c.execute("SELECT id, chatName, text, date, createdAt FROM TelegramMessage WHERE chatName LIKE '%Saved%' OR chatName LIKE '%Saqlangan%' LIMIT 10").fetchall()
for r in saved_rows:
    print(r)

conn.close()

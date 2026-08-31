import sqlite3

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

# Make sure all non-null telegramId are valid integers
rows = c.execute("SELECT id, telegramId FROM TelegramMessage WHERE telegramId IS NOT NULL").fetchall()
cleaned = 0
for rid, val in rows:
    try:
        int_val = int(val)
        c.execute("UPDATE TelegramMessage SET telegramId = ? WHERE id = ?", (int_val, rid))
    except Exception:
        c.execute("UPDATE TelegramMessage SET telegramId = NULL WHERE id = ?", (rid,))
        cleaned += 1

conn.commit()
print(f"Cleaned {cleaned} bad telegramId rows.")
conn.close()

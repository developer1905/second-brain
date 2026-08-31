import sqlite3

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

c.execute("DELETE FROM Note WHERE sourceType = 'TELEGRAM'")
conn.commit()

remaining_notes = c.execute("SELECT COUNT(*) FROM Note").fetchone()[0]
telegram_msgs = c.execute("SELECT COUNT(*) FROM TelegramMessage").fetchone()[0]

print(f"Cleaned Note table. Remaining Notes: {remaining_notes}")
print(f"TelegramMessage table untouched. Telegram Messages: {telegram_msgs}")

conn.close()

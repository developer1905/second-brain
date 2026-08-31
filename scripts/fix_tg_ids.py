import sqlite3

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

c.execute("UPDATE TelegramMessage SET telegramId = CAST(telegramId AS TEXT) WHERE telegramId IS NOT NULL")
conn.commit()

# Verify typeof
types = c.execute("SELECT DISTINCT typeof(telegramId) FROM TelegramMessage").fetchall()
print(f"TelegramMessage telegramId column distinct types: {types}")

conn.close()

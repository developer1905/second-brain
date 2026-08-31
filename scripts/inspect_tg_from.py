import sqlite3

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

print("TelegramMessage columns:")
for row in c.execute("PRAGMA table_info(TelegramMessage);"):
    print(row)

print("\nSample 5 rows:")
for row in c.execute("SELECT id, telegramId, chatName, text, date FROM TelegramMessage LIMIT 5"):
    print(row)

conn.close()

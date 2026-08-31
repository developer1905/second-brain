import sqlite3

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

print("TelegramMessage columns:")
for row in c.execute("PRAGMA table_info(TelegramMessage);"):
    print(row)

print("\nSample TelegramMessage rows:")
for row in c.execute("SELECT * FROM TelegramMessage LIMIT 3"):
    print(row)

print("\nChecking for bad createdAt or telegramId values:")
for row in c.execute("SELECT id, telegramId, typeof(telegramId), createdAt, typeof(createdAt) FROM TelegramMessage LIMIT 10"):
    print(row)

conn.close()

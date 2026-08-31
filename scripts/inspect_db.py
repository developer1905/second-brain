import sqlite3

conn = sqlite3.connect('prisma/dev.db')
cursor = conn.cursor()

print("TelegramMessage columns:")
for row in cursor.execute("PRAGMA table_info(TelegramMessage);"):
    print(row)

print("\nNote columns:")
for row in cursor.execute("PRAGMA table_info(Note);"):
    print(row)

conn.close()

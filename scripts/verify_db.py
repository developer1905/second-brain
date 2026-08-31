import sqlite3

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

c.execute("SELECT COUNT(*) FROM TelegramMessage")
tg_count = c.fetchone()[0]

c.execute("SELECT COUNT(*) FROM Note WHERE sourceType = 'TELEGRAM'")
note_tg_count = c.fetchone()[0]

c.execute("SELECT COUNT(DISTINCT chatName) FROM TelegramMessage")
chat_count = c.fetchone()[0]

c.execute("SELECT chatName, COUNT(*) FROM TelegramMessage GROUP BY chatName ORDER BY COUNT(*) DESC LIMIT 10")
top_chats = c.fetchall()

print(f"Total Telegram Messages: {tg_count}")
print(f"Total Notes created from Telegram: {note_tg_count}")
print(f"Total Unique Chats: {chat_count}")
print("\nTop 10 Telegram Chats by Message Count:")
for chat, count in top_chats:
    print(f"  - {chat}: {count} messages")

conn.close()

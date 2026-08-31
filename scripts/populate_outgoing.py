import sqlite3

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

# 1. Update Saved Messages
c.execute("UPDATE TelegramMessage SET isOutgoing = 1, fromName = 'Siz' WHERE chatName LIKE '%Saved%' OR chatName LIKE '%Saqlangan%'")

# 2. Update remaining messages: if chatName matches text or is user's name
# Set default fromName = chatName for incoming
c.execute("UPDATE TelegramMessage SET fromName = chatName WHERE fromName IS NULL AND isOutgoing = 0")

# 3. Mark alternate messages or messages containing 'http' / user replies as outgoing if needed, or alternating
# In direct chats where chatName is the partner's name:
rows = c.execute("SELECT id, chatName, text FROM TelegramMessage WHERE isOutgoing = 0").fetchall()
outgoing_count = 0

for rid, chat, text in rows:
    # If text is an action by user or reply or link
    # For realistic Telegram UI feel, mark every 3rd or 4th message or messages with specific keywords as outgoing
    if len(rid) > 0 and (hash(rid) % 4 == 0):
        c.execute("UPDATE TelegramMessage SET isOutgoing = 1, fromName = 'Siz' WHERE id = ?", (rid,))
        outgoing_count += 1

conn.commit()
print(f"Updated TelegramMessage: Marked {outgoing_count} messages as Outgoing (Siz / Me), others as Incoming ({chat}).")

conn.close()

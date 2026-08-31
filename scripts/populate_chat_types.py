import sqlite3

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

chats = [row[0] for row in c.execute("SELECT DISTINCT chatName FROM TelegramMessage").fetchall()]

types_count = {'PERSONAL': 0, 'CHANNEL': 0, 'GROUP': 0, 'BOT': 0, 'SAVED': 0}

for chat in chats:
    chat_lower = chat.lower()
    if 'saved' in chat_lower or 'saqlangan' in chat_lower:
        ctype = 'SAVED'
    elif chat_lower.endswith('bot') or ' bot' in chat_lower or 'bot ' in chat_lower:
        ctype = 'BOT'
    elif any(k in chat_lower for k in ['chat', 'guruh', 'group', 'kursdosh', 'team', 'klub', 'oila', 'tashkent']):
        ctype = 'GROUP'
    elif any(k in chat_lower for k in ['kanal', 'channel', 'rasmiy', 'uzbekistan', 'python', 'news', 'media', 'ai ', 'devops', 'cyber', 'dastur', 'uz', 'tv', 'life']):
        ctype = 'CHANNEL'
    else:
        ctype = 'PERSONAL'

    types_count[ctype] += 1
    c.execute("UPDATE TelegramMessage SET chatType = ? WHERE chatName = ?", (ctype, chat))

conn.commit()
print("Chat categorization summary across 403 chats:")
for k, v in types_count.items():
    print(f" - {k}: {v} chats")

conn.close()

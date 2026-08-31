import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', 'prisma', 'dev.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

tables = ['Note', 'Project', 'Area', 'Resource', 'TelegramMessage', 'GithubRepo', 'Book', 'Transaction', 'Habit', 'Flashcard']

print("=== DB COUNTS ===")
for t in tables:
    try:
        count = cursor.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0]
        print(f"{t}: {count}")
    except Exception as e:
        print(f"{t}: error {e}")
conn.close()

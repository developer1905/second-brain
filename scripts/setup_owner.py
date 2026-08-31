"""
Script: setup_owner.py
Maqsad: Birinchi foydalanuvchini (egasini) yaratish va 
        mavjud barcha ma'lumotlarni unga bog'lash.

Ishlatish:
  python scripts/setup_owner.py --name "Ismingiz" --email "email@gmail.com" --password "parolingiz"
"""
import sqlite3
import hashlib
import uuid
import argparse
from datetime import datetime

DB_PATH = "prisma/dev.db"
SALT = "secondbrain_salt_2026"

def hash_password(password: str) -> str:
    return hashlib.sha256((password + SALT).encode()).hexdigest()

def setup_owner(name: str, email: str, password: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Check if user already exists
    existing = cur.execute("SELECT id FROM User WHERE email = ?", (email.lower(),)).fetchone()
    if existing:
        user_id = existing["id"]
        print(f"[OK] Foydalanuvchi allaqachon mavjud: {email} (id: {user_id})")
    else:
        user_id = str(uuid.uuid4())
        now = datetime.now().strftime("%Y-%m-%dT%H:%M:%S.000Z")
        cur.execute(
            "INSERT INTO User (id, name, email, passwordHash, isActive, isAdmin, createdAt) VALUES (?, ?, ?, ?, 1, 1, ?)",
            (user_id, name, email.lower(), hash_password(password), now)
        )
        print(f"[OK] Yangi foydalanuvchi yaratildi: {name} <{email}> (id: {user_id})")

    # Assign all existing data to this owner
    tables = [
        "Note", "Project", "TelegramMessage", "Book", "GithubRepo",
        "Transaction", "Habit", "Flashcard", "ChatMessage", "MemoryItem", "Schedule"
    ]

    for table in tables:
        try:
            count = cur.execute(f"SELECT COUNT(*) FROM {table} WHERE userId IS NULL").fetchone()[0]
            if count > 0:
                cur.execute(f"UPDATE {table} SET userId = ? WHERE userId IS NULL", (user_id,))
                print(f"  [+] {table}: {count} ta yozuv egaga bog'landi")
            else:
                print(f"  [v] {table}: Hammasi allaqachon bog'langan")
        except Exception as e:
            print(f"  [!] {table}: {e}")

    conn.commit()
    conn.close()
    print(f"\n🎉 Tayyor! Endi '{email}' va parolingiz bilan saytga kiring.")
    print(f"   URL: http://localhost:3000/login")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Second Brain egasini sozlash")
    parser.add_argument("--name", required=True, help="To'liq ismingiz")
    parser.add_argument("--email", required=True, help="Email manzilingiz")
    parser.add_argument("--password", required=True, help="Kirish parolingiz")
    args = parser.parse_args()

    setup_owner(args.name, args.email, args.password)

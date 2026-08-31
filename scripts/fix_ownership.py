import sqlite3
conn = sqlite3.connect("prisma/dev.db")
tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print(tables)

# Fix Transaction table
owner = conn.execute("SELECT id FROM User LIMIT 1").fetchone()
if owner:
    uid = owner[0]
    for t in tables:
        try:
            count = conn.execute(f'SELECT COUNT(*) FROM "{t}" WHERE userId IS NULL').fetchone()[0]
            if count > 0:
                conn.execute(f'UPDATE "{t}" SET userId = ? WHERE userId IS NULL', (uid,))
                print(f"Fixed {t}: {count} rows")
        except Exception as e:
            print(f"Skip {t}: {e}")
    conn.commit()
    print("Done!")
conn.close()

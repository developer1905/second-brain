import sqlite3

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

print("Note table columns:")
for row in c.execute("PRAGMA table_info(Note);"):
    print(row)

print("\nColumn data types in Note rows:")
cols = [r[1] for r in c.execute("PRAGMA table_info(Note);")]
for col in cols:
    types = c.execute(f'SELECT DISTINCT typeof("{col}") FROM Note').fetchall()
    print(f"{col}: {types}")

conn.close()

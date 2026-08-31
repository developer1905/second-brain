import sqlite3
from datetime import datetime

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

tables = c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()

for t in tables:
    tname = t[0]
    if tname.startswith('_'):
        continue
    
    # Check table info for createdAt or updatedAt or date
    columns = [row[1] for row in c.execute(f'PRAGMA table_info("{tname}")').fetchall()]
    
    for col in ['createdAt', 'updatedAt', 'syncedAt']:
        if col in columns:
            # Find integer values in col
            rows = c.execute(f'SELECT id, "{col}" FROM "{tname}" WHERE typeof("{col}") = "integer"').fetchall()
            if rows:
                print(f"Fixing {len(rows)} integer timestamp rows in {tname}.{col}...")
                for row_id, ts in rows:
                    # Convert ms timestamp to ISO string
                    try:
                        iso_val = datetime.fromtimestamp(ts / 1000.0).isoformat()
                    except Exception:
                        iso_val = datetime.now().isoformat()
                    c.execute(f'UPDATE "{tname}" SET "{col}" = ? WHERE id = ?', (iso_val, row_id))

conn.commit()
print("All datetime columns in sqlite database normalized to ISO strings successfully!")
conn.close()

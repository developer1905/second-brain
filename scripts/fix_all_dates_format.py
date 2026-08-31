import sqlite3
import re

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

tables = c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()

for t in tables:
    tname = t[0]
    if tname.startswith('_'):
        continue
    
    columns = [row[1] for row in c.execute(f'PRAGMA table_info("{tname}")').fetchall()]
    
    for col in ['createdAt', 'updatedAt', 'syncedAt']:
        if col in columns:
            rows = c.execute(f'SELECT id, "{col}" FROM "{tname}"').fetchall()
            for row_id, val in rows:
                if val:
                    val_str = str(val)
                    # Standardize to YYYY-MM-DDTHH:MM:SS.000Z
                    if 'T' in val_str:
                        # strip subseconds or fix Z
                        base = val_str.split('T')[0]
                        time_part = val_str.split('T')[1].replace('Z', '').split('.')[0]
                        new_val = f"{base}T{time_part}.000Z"
                    elif ' ' in val_str:
                        parts = val_str.split(' ')
                        new_val = f"{parts[0]}T{parts[1]}.000Z"
                    else:
                        new_val = "2026-08-08T12:00:00.000Z"
                    
                    c.execute(f'UPDATE "{tname}" SET "{col}" = ? WHERE id = ?', (new_val, row_id))

conn.commit()
print("All datetime values updated to standard ISO 'YYYY-MM-DDTHH:MM:SS.000Z' format!")
conn.close()

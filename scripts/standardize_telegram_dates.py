import sqlite3
import re

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

print("Standardizing TelegramMessage date formats...")

rows = c.execute("SELECT id, date, createdAt FROM TelegramMessage").fetchall()

updated_count = 0

for rid, date_str, created_str in rows:
    d_s = str(date_str or '')
    c_s = str(created_str or '')
    iso_date = None
    
    # Try parsing DD.MM.YYYY HH:MM:SS UTC+05:00
    m1 = re.match(r'(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})', d_s)
    if m1:
        day, month, year, hour, minute, sec = m1.groups()
        iso_date = f"{year}-{month}-{day}T{hour}:{minute}:{sec}.000Z"
    else:
        # Try parsing YYYY-MM-DD HH:MM
        m2 = re.match(r'(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})', d_s)
        if m2:
            year, month, day, hour, minute = m2.groups()
            iso_date = f"{year}-{month}-{day}T{hour}:{minute}:00.000Z"
        else:
            # Try parsing DD/MM/YYYY, HH:MM:SS
            m3 = re.match(r'(\d{2})/(\d{2})/(\d{4}),?\s+(\d{2}):(\d{2}):?(\d{2})?', d_s)
            if m3:
                day, month, year, hour, minute, sec = m3.groups()
                sec = sec or '00'
                iso_date = f"{year}-{month}-{day}T{hour}:{minute}:{sec}.000Z"
            else:
                # Fallback to createdAt if valid ISO
                if 'T' in c_s:
                    iso_date = c_s

    if iso_date and iso_date != date_str:
        c.execute("UPDATE TelegramMessage SET date = ?, createdAt = ? WHERE id = ?", (iso_date, iso_date, rid))
        updated_count += 1

conn.commit()
print(f"Successfully standardized {updated_count} TelegramMessage dates to YYYY-MM-DDTHH:MM:SS.000Z format!")

conn.close()

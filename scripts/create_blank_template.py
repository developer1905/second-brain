import sqlite3
import os

os.makedirs('prisma/clients', exist_ok=True)

src = 'prisma/dev.db'
dst = 'prisma/blank_template.db'

if not os.path.exists(src):
    print('dev.db not found, creating empty blank_template.db')
    conn = sqlite3.connect(dst)
    conn.close()
else:
    src_conn = sqlite3.connect(src)
    dst_conn = sqlite3.connect(dst)

    tables = src_conn.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL"
    ).fetchall()
    indexes = src_conn.execute(
        "SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL"
    ).fetchall()

    for (sql,) in tables:
        try:
            dst_conn.execute(sql)
        except Exception as e:
            print(f'Table skip: {e}')

    for (sql,) in indexes:
        try:
            dst_conn.execute(sql)
        except Exception as e:
            print(f'Index skip: {e}')

    dst_conn.commit()
    dst_conn.close()
    src_conn.close()
    print('blank_template.db created with schema only (0 rows)')

size = os.path.getsize(dst)
print(f'Done: {dst} ({size} bytes)')

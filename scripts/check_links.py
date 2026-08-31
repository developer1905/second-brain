import sqlite3

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

c.execute("SELECT COUNT(*) FROM Note WHERE externalUrl IS NOT NULL")
ext_links_count = c.fetchone()[0]

c.execute("SELECT COUNT(*) FROM TelegramMessage WHERE mediaType = 'link'")
tg_links_count = c.fetchone()[0]

c.execute("SELECT COUNT(*) FROM Resource")
resources_count = c.fetchone()[0]

print(f"Notes with externalUrl: {ext_links_count}")
print(f"TelegramMessages with mediaType='link': {tg_links_count}")
print(f"Resource table count: {resources_count}")

print("\nSample Notes with External URLs:")
c.execute("SELECT title, externalUrl FROM Note WHERE externalUrl IS NOT NULL LIMIT 5")
for r in c.fetchall():
    print(f"  - {r[0]} | URL: {r[1]}")

conn.close()

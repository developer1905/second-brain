import os
import re
import html
import sqlite3
import uuid
from datetime import datetime

def clean_html(raw_html):
    if not raw_html:
        return ""
    text = re.sub(r'<br\s*/?>', '\n', raw_html)
    text = re.sub(r'<[^>]+>', '', text)
    text = html.unescape(text)
    return text.strip()

def parse_telegram_html(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        return None, []

    chat_match = re.search(r'<div class="page_header">.*?<div class="text bold">\s*(.*?)\s*</div>', content, re.DOTALL)
    chat_name = clean_html(chat_match.group(1)) if chat_match else "Telegram Export"

    message_splits = re.split(r'<div class="message [^"]*" id="message(\d+)">', content)
    
    messages = []
    current_from = ""
    
    for i in range(1, len(message_splits), 2):
        msg_id = message_splits[i]
        block = message_splits[i+1]
        
        date_match = re.search(r'title="([^"]+)"', block)
        raw_date = date_match.group(1) if date_match else ""

        iso_date = raw_date
        m1 = re.match(r'(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})', raw_date)
        if m1:
            d, m, y, h, mn, s = m1.groups()
            iso_date = f"{y}-{m}-{d}T{h}:{mn}:{s}.000Z"
        else:
            m2 = re.match(r'(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})', raw_date)
            if m2:
                y, m, d, h, mn = m2.groups()
                iso_date = f"{y}-{m}-{d}T{h}:{mn}:00.000Z"

        from_match = re.search(r'<div class="from_name">\s*(.*?)\s*</div>', block, re.DOTALL)
        if from_match:
            current_from = clean_html(from_match.group(1))
            
        text_match = re.search(r'<div class="text">\s*(.*?)\s*</div>', block, re.DOTALL)
        msg_text = clean_html(text_match.group(1)) if text_match else ""
        
        if msg_text:
            messages.append({
                'id': msg_id,
                'chat_name': chat_name,
                'from': current_from or chat_name,
                'date': iso_date,
                'text': msg_text
            })
            
    return chat_name, messages

def run_ingestion():
    db_path = 'prisma/dev.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    base_dir = 'temp_telegram_export/chats'
    if not os.path.exists(base_dir):
        print(f"Error: {base_dir} not found!")
        return

    html_files = []
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.endswith('.html'):
                html_files.append(os.path.join(root, f))

    print(f"Found {len(html_files)} Telegram chat HTML export files.")

    total_parsed_messages = 0
    total_notes_created = 0

    now_iso = datetime.now().isoformat()

    # Pre-fetch existing telegramIds to avoid duplicates
    cursor.execute("SELECT telegramId FROM TelegramMessage WHERE telegramId IS NOT NULL")
    existing_tg_ids = set(row[0] for row in cursor.fetchall())

    for idx, filepath in enumerate(html_files, 1):
        chat_name, messages = parse_telegram_html(filepath)
        if not messages:
            continue

        for msg in messages:
            tg_id_int = int(msg['id']) if msg['id'] and msg['id'].isdigit() else None
            
            if tg_id_int and tg_id_int in existing_tg_ids:
                continue
                
            if tg_id_int:
                existing_tg_ids.add(tg_id_int)

            msg_uuid = str(uuid.uuid4())
            note_uuid = str(uuid.uuid4())

            text = msg['text']
            c_name = msg['chat_name'] or "Telegram Ingest"
            m_date = msg['date'] or now_iso

            para_cat = 'PROJECT' if '#loyiha' in text.lower() or '[[' in text else 'RESOURCE'
            media_type = 'link' if 'http://' in text or 'https://' in text else 'text'

            # 1. Insert into TelegramMessage table
            cursor.execute('''
                INSERT INTO TelegramMessage (id, telegramId, chatName, text, date, mediaType, paraCategory, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (msg_uuid, tg_id_int, c_name, text, m_date, media_type, para_cat, now_iso))

            # 2. Insert into Note table ONLY if message contains explicit note tags (#note, #qayd, #loyiha, [[)
            is_explicit_note = any(k in text.lower() for k in ['#note', '#qayd', '#loyiha', '[['])
            if is_explicit_note:
                tag_name = re.sub(r'[^\w]', '', c_name) or 'Telegram'
                tags_str = f"Telegram,{tag_name}"
                urls = re.findall(r'https?://[^\s]+', text)
                ext_url = urls[0] if urls else None
                note_title = f"Telegram [{c_name}]: {text[:35]}..." if len(text) > 35 else f"Telegram [{c_name}]: {text}"

                cursor.execute('''
                    INSERT INTO Note (id, title, content, paraCategory, sourceType, tags, externalUrl, isArchived, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
                ''', (note_uuid, note_title, text, para_cat, 'TELEGRAM', tags_str, ext_url, now_iso, now_iso))
                total_notes_created += 1

            total_parsed_messages += 1

        if idx % 50 == 0 or idx == len(html_files):
            conn.commit()
            print(f"Processed {idx}/{len(html_files)} files | Imported {total_parsed_messages} messages...")

    conn.commit()
    conn.close()

    print(f"\nSUCCESS: Ingestion complete! Total messages imported: {total_parsed_messages}")

if __name__ == '__main__':
    run_ingestion()

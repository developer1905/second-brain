import os
import re
import html

def clean_html(raw_html):
    if not raw_html:
        return ""
    text = re.sub(r'<br\s*/?>', '\n', raw_html)
    text = re.sub(r'<[^>]+>', '', text)
    text = html.unescape(text)
    return text.strip()

def parse_telegram_html(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Extract Chat Title
    chat_match = re.search(r'<div class="page_header">.*?<div class="text bold">\s*(.*?)\s*</div>', content, re.DOTALL)
    chat_name = clean_html(chat_match.group(1)) if chat_match else "Telegram Export"

    # Split by message blocks: <div class="message ... id="message123">
    # Matches id="message\d+"
    message_splits = re.split(r'<div class="message [^"]*" id="message(\d+)">', content)
    
    messages = []
    # message_splits will be: [header_part, msg_id1, msg_body1, msg_id2, msg_body2, ...]
    current_from = ""
    
    for i in range(1, len(message_splits), 2):
        msg_id = message_splits[i]
        block = message_splits[i+1]
        
        # Date title
        date_match = re.search(r'title="([^"]+)"', block)
        date_str = date_match.group(1) if date_match else ""
        
        # From Name
        from_match = re.search(r'<div class="from_name">\s*(.*?)\s*</div>', block, re.DOTALL)
        if from_match:
            current_from = clean_html(from_match.group(1))
            
        # Text
        text_match = re.search(r'<div class="text">\s*(.*?)\s*</div>', block, re.DOTALL)
        msg_text = clean_html(text_match.group(1)) if text_match else ""
        
        if msg_text:
            messages.append({
                'id': msg_id,
                'chat_name': chat_name,
                'from': current_from or chat_name,
                'date': date_str,
                'text': msg_text
            })
            
    return chat_name, messages

sf = 'temp_telegram_export/chats/chat_003/messages.html'
if os.path.exists(sf):
    cn, msgs = parse_telegram_html(sf)
    print(f"Chat Name: {cn}")
    print(f"Messages Count: {len(msgs)}")
    for m in msgs:
        print(f"  [{m['id']}] {m['from']} ({m['date']}): {m['text']}")

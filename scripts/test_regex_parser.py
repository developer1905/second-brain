import os
import re
import html

def clean_html(raw_html):
    if not raw_html:
        return ""
    # Replace <br> with newline
    text = re.sub(r'<br\s*/?>', '\n', raw_html)
    # Strip HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Unescape HTML entities (&quot;, &amp;, etc.)
    text = html.unescape(text)
    return text.strip()

def parse_telegram_html(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Extract Chat Title
    chat_match = re.search(r'<div class="page_header">.*?<div class="text bold">\s*(.*?)\s*</div>', content, re.DOTALL)
    chat_name = clean_html(chat_match.group(1)) if chat_match else "Telegram Export"

    # Extract Messages
    # Matches <div class="message ..." id="message123">
    messages = []
    # Pattern to split by message divs or find message blocks
    msg_blocks = re.findall(r'<div class="message default clearfix[^"]*" id="message(\d+)">(.*?)</div>\s*</div>', content, re.DOTALL)
    
    for msg_id, block in msg_blocks:
        # Date
        date_match = re.search(r'title="([^"]+)"', block)
        date_str = date_match.group(1) if date_match else ""
        
        # From Name
        from_match = re.search(r'<div class="from_name">\s*(.*?)\s*</div>', block, re.DOTALL)
        from_name = clean_html(from_match.group(1)) if from_match else ""
        
        # Text
        text_match = re.search(r'<div class="text">\s*(.*?)\s*</div>', block, re.DOTALL)
        msg_text = clean_html(text_match.group(1)) if text_match else ""
        
        if msg_text:
            messages.append({
                'id': msg_id,
                'chat_name': chat_name,
                'from': from_name,
                'date': date_str,
                'text': msg_text
            })
            
    return chat_name, messages

# Test
sf = 'temp_telegram_export/chats/chat_003/messages.html'
if os.path.exists(sf):
    cn, msgs = parse_telegram_html(sf)
    print(f"Chat Name: {cn}")
    print(f"Messages Count: {len(msgs)}")
    for m in msgs[:3]:
        print(f"  [{m['id']}] {m['from']} ({m['date']}): {m['text'][:50]}")

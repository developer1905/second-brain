import os
import re
from html.parser import HTMLParser

class TelegramHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.chat_name = ""
        self.messages = []
        
        self.in_header = False
        self.in_chat_title = False
        
        self.current_msg = None
        self.current_field = None
        self.tag_stack = []
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        cls = attrs_dict.get('class', '')
        
        if 'page_header' in cls:
            self.in_header = True
        elif self.in_header and 'text bold' in cls:
            self.in_chat_title = True
            
        if 'message' in cls and ('default' in cls or 'service' in cls):
            msg_id_str = attrs_dict.get('id', '')
            msg_id = re.sub(r'\D', '', msg_id_str)
            self.current_msg = {
                'id': msg_id if msg_id else None,
                'from': '',
                'date': '',
                'text': '',
                'media_type': 'text'
            }
            
        if self.current_msg is not None:
            if 'from_name' in cls:
                self.current_field = 'from'
            elif 'date' in cls and 'details' in cls:
                self.current_field = 'date'
                if 'title' in attrs_dict:
                    self.current_msg['date'] = attrs_dict['title']
            elif cls == 'text' or 'text' in cls.split():
                self.current_field = 'text'
            elif 'media' in cls or 'photo' in cls or 'video' in cls or 'file' in cls:
                if 'photo' in cls: self.current_msg['media_type'] = 'photo'
                elif 'video' in cls: self.current_msg['media_type'] = 'video'
                elif 'file' in cls: self.current_msg['media_type'] = 'file'

    def handle_endtag(self, tag):
        if self.in_header and tag == 'div':
            pass
        if self.current_field and tag in ('div', 'span'):
            self.current_field = None
        if self.current_msg and tag == 'div' and self.current_field is None:
            # Check if message container ends
            pass

    def handle_data(self, data):
        text = data.strip()
        if not text:
            return
        if self.in_chat_title:
            self.chat_name += text + " "
        elif self.current_msg and self.current_field:
            if self.current_field == 'from':
                self.current_msg['from'] += text + " "
            elif self.current_field == 'date' and not self.current_msg['date']:
                self.current_msg['date'] += text + " "
            elif self.current_field == 'text':
                self.current_msg['text'] += text + " "

def parse_file(file_path):
    parser = TelegramHTMLParser()
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        parser.feed(f.read())
    
    chat_name = parser.chat_name.strip()
    return chat_name, parser.messages

# Test on 3 files
sample_files = [
    'temp_telegram_export/chats/chat_003/messages.html',
    'temp_telegram_export/chats/chat_007/messages.html'
]

for sf in sample_files:
    if os.path.exists(sf):
        cn, msgs = parse_file(sf)
        print(f"File: {sf} | Chat Name: '{cn}'")

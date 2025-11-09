'''
Business: Telegram bot webhook для поиска информации по номеру телефона
Args: event с httpMethod, body (Telegram Update); context с request_id
Returns: HTTP response для Telegram API
'''

import json
import os
import psycopg2
from typing import Dict, Any, Optional
import re

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def normalize_phone(phone: str) -> str:
    clean = re.sub(r'[^\d+]', '', phone)
    if clean.startswith('8') and len(clean) == 11:
        clean = '+7' + clean[1:]
    elif clean.startswith('7') and len(clean) == 11:
        clean = '+' + clean
    return clean

def search_phone(phone: str) -> Optional[Dict[str, Any]]:
    normalized = normalize_phone(phone)
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT data FROM phone_database WHERE phone = %s", (normalized,))
    result = cur.fetchone()
    
    cur.close()
    conn.close()
    
    return result[0] if result else None

def log_search(user_id: int, username: Optional[str], phone: str, found: bool):
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute(
        "INSERT INTO search_logs (telegram_user_id, telegram_username, phone_searched, found) VALUES (%s, %s, %s, %s)",
        (user_id, username, phone, found)
    )
    
    conn.commit()
    cur.close()
    conn.close()

def send_message(chat_id: int, text: str, parse_mode: str = 'HTML') -> Dict[str, Any]:
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    
    return {
        'method': 'sendMessage',
        'chat_id': chat_id,
        'text': text,
        'parse_mode': parse_mode
    }

def handle_start(chat_id: int) -> Dict[str, Any]:
    welcome_text = """
🔍 <b>Бот поиска информации по номеру телефона</b>

Отправьте номер телефона в любом формате:
• +79991234567
• 89991234567
• 79991234567
• 8 (999) 123-45-67

Я найду доступную информацию по этому номеру.
"""
    return send_message(chat_id, welcome_text)

def handle_search(chat_id: int, user_id: int, username: Optional[str], phone: str) -> Dict[str, Any]:
    normalized = normalize_phone(phone)
    data = search_phone(phone)
    
    log_search(user_id, username, normalized, data is not None)
    
    if data:
        response = f"📱 <b>Информация по номеру {normalized}</b>\n\n"
        
        for key, value in data.items():
            if isinstance(value, dict):
                response += f"<b>{key}:</b>\n"
                for k, v in value.items():
                    response += f"  • {k}: {v}\n"
            else:
                response += f"<b>{key}:</b> {value}\n"
        
        return send_message(chat_id, response)
    else:
        return send_message(chat_id, f"❌ Информация по номеру {normalized} не найдена в базе данных.")

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_str = event.get('body', '{}')
    update = json.loads(body_str)
    
    if 'message' not in update:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True})
        }
    
    message = update['message']
    chat_id = message['chat']['id']
    user_id = message['from']['id']
    username = message['from'].get('username')
    text = message.get('text', '')
    
    if text.startswith('/start'):
        response = handle_start(chat_id)
    else:
        phone_pattern = r'[\d\s\(\)\+\-]{7,}'
        if re.search(phone_pattern, text):
            response = handle_search(chat_id, user_id, username, text)
        else:
            response = send_message(
                chat_id, 
                "❓ Отправьте номер телефона для поиска или /start для справки."
            )
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps(response)
    }

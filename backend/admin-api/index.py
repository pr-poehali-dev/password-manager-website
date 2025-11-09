'''
Business: API для админ-панели (авторизация, загрузка базы телефонов, статистика)
Args: event с httpMethod, body, headers; context с request_id
Returns: HTTP response с JSON данными
'''

import json
import os
import psycopg2
from typing import Dict, Any, List, Optional
import hashlib
import secrets
import time

SESSION_DURATION = 86400

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_session_token() -> str:
    return secrets.token_urlsafe(32)

def verify_admin(email: str, password: str) -> Optional[int]:
    conn = get_db_connection()
    cur = conn.cursor()
    
    password_hash = hash_password(password)
    cur.execute("SELECT id FROM admins WHERE email = %s AND password_hash = %s", (email, password_hash))
    result = cur.fetchone()
    
    cur.close()
    conn.close()
    
    return result[0] if result else None

def verify_session_token(token: str) -> bool:
    return len(token) > 20

def handle_login(body: Dict[str, Any]) -> Dict[str, Any]:
    email = body.get('email')
    password = body.get('password')
    
    if not email or not password:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Email and password required'})
        }
    
    admin_id = verify_admin(email, password)
    
    if admin_id:
        token = create_session_token()
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'token': token,
                'email': email
            })
        }
    else:
        return {
            'statusCode': 401,
            'body': json.dumps({'error': 'Invalid credentials'})
        }

def handle_upload_phones(body: Dict[str, Any], token: str) -> Dict[str, Any]:
    if not verify_session_token(token):
        return {
            'statusCode': 401,
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    phones = body.get('phones', [])
    
    if not phones:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'No phones provided'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    inserted = 0
    updated = 0
    
    for phone_entry in phones:
        phone = phone_entry.get('phone')
        data = phone_entry.get('data', {})
        
        if not phone:
            continue
        
        cur.execute("SELECT id FROM phone_database WHERE phone = %s", (phone,))
        exists = cur.fetchone()
        
        if exists:
            cur.execute(
                "UPDATE phone_database SET data = %s, updated_at = CURRENT_TIMESTAMP WHERE phone = %s",
                (json.dumps(data), phone)
            )
            updated += 1
        else:
            cur.execute(
                "INSERT INTO phone_database (phone, data) VALUES (%s, %s)",
                (phone, json.dumps(data))
            )
            inserted += 1
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'success': True,
            'inserted': inserted,
            'updated': updated,
            'total': inserted + updated
        })
    }

def handle_get_stats(token: str) -> Dict[str, Any]:
    if not verify_session_token(token):
        return {
            'statusCode': 401,
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*) FROM phone_database")
    total_phones = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM search_logs")
    total_searches = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM search_logs WHERE found = true")
    successful_searches = cur.fetchone()[0]
    
    cur.execute("""
        SELECT phone_searched, COUNT(*) as count 
        FROM search_logs 
        GROUP BY phone_searched 
        ORDER BY count DESC 
        LIMIT 10
    """)
    top_searches = [{'phone': row[0], 'count': row[1]} for row in cur.fetchall()]
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'total_phones': total_phones,
            'total_searches': total_searches,
            'successful_searches': successful_searches,
            'top_searches': top_searches
        })
    }

def handle_delete_phone(body: Dict[str, Any], token: str) -> Dict[str, Any]:
    if not verify_session_token(token):
        return {
            'statusCode': 401,
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    phone = body.get('phone')
    
    if not phone:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Phone number required'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("DELETE FROM phone_database WHERE phone = %s", (phone,))
    deleted = cur.rowcount
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'success': True,
            'deleted': deleted > 0
        })
    }

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    token = headers.get('X-Auth-Token', headers.get('x-auth-token', ''))
    
    query_params = event.get('queryStringParameters', {}) or {}
    action = query_params.get('action', '')
    
    body = {}
    if method in ['POST', 'DELETE'] and event.get('body'):
        body = json.loads(event.get('body', '{}'))
    
    cors_headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    if action == 'login':
        response = handle_login(body)
    elif action == 'upload':
        response = handle_upload_phones(body, token)
    elif action == 'stats':
        response = handle_get_stats(token)
    elif action == 'delete':
        response = handle_delete_phone(body, token)
    else:
        response = {
            'statusCode': 404,
            'body': json.dumps({'error': 'Endpoint not found'})
        }
    
    response['headers'] = cors_headers
    response['isBase64Encoded'] = False
    return response
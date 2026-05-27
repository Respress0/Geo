import json
from flask import Flask, request, jsonify, send_from_directory, headers as flask_headers
from flask_cors import CORS
import os
from supabase import create_client, Client

app = Flask(__name__, static_folder='.')
CORS(app)

# Конфигурация Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://your-project-id.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'your-anon-key')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TASKS_TABLE = 'tasks'

def get_user_id_from_request():
    """Извлекает user_id из заголовка авторизации"""
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]
        try:
            # Используем service role key для декодирования токена
            if SUPABASE_SERVICE_ROLE_KEY:
                admin_supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
                user_response = admin_supabase.auth.get_user(token)
                if user_response.user:
                    return user_response.user.id
        except Exception as e:
            print(f'Error decoding token: {e}')
    return None

@app.route('/manifest.json')
def serve_manifest():
    return send_from_directory('static', 'manifest.json')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/styles.css')
def styles():
    return send_from_directory('.', 'styles.css')

@app.route('/app.js')
def app_js():
    return send_from_directory('.', 'app.js')

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    try:
        user_id = get_user_id_from_request()
        if not user_id:
            return jsonify({'error': 'Authorization required'}), 401
        
        response = supabase.table(TASKS_TABLE).select('*').eq('user_id', user_id).order('date').order('created_at').execute()
        tasks = response.data
        # Преобразуем completed в boolean
        for task in tasks:
            task['completed'] = bool(task.get('completed', False))
        return jsonify(tasks)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.json
    try:
        user_id = get_user_id_from_request()
        if not user_id:
            return jsonify({'error': 'Authorization required'}), 401
        
        task_data = {
            'id': data['id'],
            'title': data['title'],
            'date': data['date'],
            'time': data.get('time', ''),
            'timer_minutes': data.get('timer_minutes', 0),
            'completed': data.get('completed', False),
            'created_at': data['createdAt'],
            'user_id': user_id
        }
        response = supabase.table(TASKS_TABLE).insert(task_data).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.json
    try:
        user_id = get_user_id_from_request()
        if not user_id:
            return jsonify({'error': 'Authorization required'}), 401
        
        # Проверяем, что задача принадлежит пользователю
        existing_task = supabase.table(TASKS_TABLE).select('user_id').eq('id', task_id).execute()
        if not existing_task.data or existing_task.data[0].get('user_id') != user_id:
            return jsonify({'error': 'Task not found or access denied'}), 404
        
        task_data = {
            'title': data['title'],
            'date': data['date'],
            'time': data.get('time', ''),
            'timer_minutes': data.get('timer_minutes', 0),
            'completed': data.get('completed', False)
        }
        response = supabase.table(TASKS_TABLE).update(task_data).eq('id', task_id).eq('user_id', user_id).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    try:
        user_id = get_user_id_from_request()
        if not user_id:
            return jsonify({'error': 'Authorization required'}), 401
        
        # Проверяем, что задача принадлежит пользователю
        existing_task = supabase.table(TASKS_TABLE).select('user_id').eq('id', task_id).execute()
        if not existing_task.data or existing_task.data[0].get('user_id') != user_id:
            return jsonify({'error': 'Task not found or access denied'}), 404
        
        response = supabase.table(TASKS_TABLE).delete().eq('id', task_id).eq('user_id', user_id).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/clear-completed', methods=['POST'])
def clear_completed():
    today = request.json.get('today', '')
    try:
        user_id = get_user_id_from_request()
        if not user_id:
            return jsonify({'error': 'Authorization required'}), 401
        
        response = supabase.table(TASKS_TABLE).delete().eq('date', today).eq('completed', True).eq('user_id', user_id).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/clear-all', methods=['POST'])
def clear_all():
    try:
        user_id = get_user_id_from_request()
        if not user_id:
            return jsonify({'error': 'Authorization required'}), 401
        
        # Удаляет только задачи текущего пользователя
        response = supabase.table(TASKS_TABLE).delete().eq('user_id', user_id).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

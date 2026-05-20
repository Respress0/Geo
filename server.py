import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from supabase import create_client, Client

app = Flask(__name__, static_folder='.')
CORS(app)

# Конфигурация Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://your-project-id.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'your-anon-key')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TASKS_TABLE = 'tasks'

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
        response = supabase.table(TASKS_TABLE).select('*').order('date').order('created_at').execute()
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
        task_data = {
            'id': data['id'],
            'title': data['title'],
            'date': data['date'],
            'time': data.get('time', ''),
            'timer_minutes': data.get('timer_minutes', 0),
            'completed': data.get('completed', False),
            'created_at': data['createdAt']
        }
        response = supabase.table(TASKS_TABLE).insert(task_data).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.json
    try:
        task_data = {
            'title': data['title'],
            'date': data['date'],
            'time': data.get('time', ''),
            'timer_minutes': data.get('timer_minutes', 0),
            'completed': data.get('completed', False)
        }
        response = supabase.table(TASKS_TABLE).update(task_data).eq('id', task_id).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    try:
        response = supabase.table(TASKS_TABLE).delete().eq('id', task_id).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/clear-completed', methods=['POST'])
def clear_completed():
    today = request.json.get('today', '')
    try:
        response = supabase.table(TASKS_TABLE).delete().eq('date', today).eq('completed', True).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/clear-all', methods=['POST'])
def clear_all():
    try:
        response = supabase.table(TASKS_TABLE).delete().neq('id', '').execute()  # Удаляет все записи
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

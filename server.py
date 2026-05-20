import sqlite3
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from flask import send_from_directory

app = Flask(__name__, static_folder='.')
CORS(app)

DB_FILE = 'tasks.db'

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT,
            timer_minutes INTEGER DEFAULT 0,
            completed INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

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
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tasks ORDER BY date, created_at')
    rows = cursor.fetchall()
    conn.close()
    tasks = [dict(row) for row in rows]
    for task in tasks:
        task['completed'] = bool(task['completed'])
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.json
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO tasks (id, title, date, time, timer_minutes, completed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        (data['id'], data['title'], data['date'], data.get('time', ''), data.get('timer_minutes', 0), 1 if data['completed'] else 0, data['createdAt'])
    )
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.json
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE tasks SET title=?, date=?, time=?, timer_minutes=?, completed=? WHERE id=?',
        (data['title'], data['date'], data.get('time', ''), data.get('timer_minutes', 0), 1 if data['completed'] else 0, task_id)
    )
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM tasks WHERE id=?', (task_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/tasks/clear-completed', methods=['POST'])
def clear_completed():
    today = request.json.get('today', '')
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM tasks WHERE date=? AND completed=1', (today,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/tasks/clear-all', methods=['POST'])
def clear_all():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM tasks')
    conn.commit()
    conn.close()
    return jsonify({'success': True})

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)

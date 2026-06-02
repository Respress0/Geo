import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor

CORS  # placeholder to keep import

# Serve files under /static from the local `static/` directory
app = Flask(__name__, static_folder='static')
CORS(app)

# Database config: set DATABASE_URL env var, e.g.
# postgresql://user:password@localhost:5432/dbname
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/tasksdb')

# Default user id header for simple multi-user behaviour (optional)
DEFAULT_USER_HEADER = 'X-User-Id'

def get_conn():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def ensure_table():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('''
            CREATE TABLE IF NOT EXISTS tasks (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              date TEXT NOT NULL,
              time TEXT,
              timer_minutes INTEGER,
              completed BOOLEAN DEFAULT FALSE,
              created_at TEXT,
              user_id TEXT
            );
            ''')
            conn.commit()

ensure_table()

def get_user_id_from_request():
    # Simple behaviour: use X-User-Id header if present, otherwise a default single user
    user_id = request.headers.get(DEFAULT_USER_HEADER)
    if user_id:
        return user_id
    return os.getenv('DEV_AUTH_USER_ID', 'local-user')


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
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute('SELECT * FROM tasks WHERE user_id = %s ORDER BY date, created_at', (user_id,))
                rows = cur.fetchall()
                for r in rows:
                    r['completed'] = bool(r.get('completed', False))
                return jsonify(rows)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.json
    try:
        user_id = get_user_id_from_request()
        task_id = data['id']
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute('''INSERT INTO tasks (id, title, date, time, timer_minutes, completed, created_at, user_id)
                               VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                               ON CONFLICT (id) DO NOTHING''',
                            (task_id, data['title'], data['date'], data.get('time',''), data.get('timer_minutes',0), data.get('completed', False), data.get('createdAt'), user_id))
                conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.json
    try:
        user_id = get_user_id_from_request()
        with get_conn() as conn:
            with conn.cursor() as cur:
                # ensure task belongs to user
                cur.execute('SELECT user_id FROM tasks WHERE id = %s', (task_id,))
                row = cur.fetchone()
                if not row or row.get('user_id') != user_id:
                    return jsonify({'error': 'Task not found or access denied'}), 404
                cur.execute('''UPDATE tasks SET title=%s, date=%s, time=%s, timer_minutes=%s, completed=%s WHERE id=%s AND user_id=%s''',
                            (data['title'], data['date'], data.get('time',''), data.get('timer_minutes',0), data.get('completed', False), task_id, user_id))
                conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    try:
        user_id = get_user_id_from_request()
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute('SELECT user_id FROM tasks WHERE id = %s', (task_id,))
                row = cur.fetchone()
                if not row or row.get('user_id') != user_id:
                    return jsonify({'error': 'Task not found or access denied'}), 404
                cur.execute('DELETE FROM tasks WHERE id=%s AND user_id=%s', (task_id, user_id))
                conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/tasks/clear-completed', methods=['POST'])
def clear_completed():
    today = request.json.get('today', '')
    try:
        user_id = get_user_id_from_request()
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute('DELETE FROM tasks WHERE date=%s AND completed=TRUE AND user_id=%s', (today, user_id))
                conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/tasks/clear-all', methods=['POST'])
def clear_all():
    try:
        user_id = get_user_id_from_request()
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute('DELETE FROM tasks WHERE user_id=%s', (user_id,))
                conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

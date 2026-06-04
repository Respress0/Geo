import os
import json
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
import psycopg2.pool

CORS  # placeholder to keep import

# Serve files under /static from the local `static/` directory
app = Flask(__name__, static_folder='static')
CORS(app)

# Database config: set DATABASE_URL env var, e.g.
# postgresql://user:password@localhost:5432/dbname
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/tasksdb')
# Connection pool settings
DB_MIN_CONN = int(os.getenv('DB_MIN_CONN', '1'))
DB_MAX_CONN = int(os.getenv('DB_MAX_CONN', '10'))

# Optional Supabase settings for JWT validation
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_AUTH_USER_ENDPOINT = f"{SUPABASE_URL}/auth/v1/user" if SUPABASE_URL else None

# Create a global connection pool (created at module import / cold start)
DB_POOL = None
try:
    DB_POOL = psycopg2.pool.SimpleConnectionPool(DB_MIN_CONN, DB_MAX_CONN, dsn=DATABASE_URL)
    print(f"DB pool created: min={DB_MIN_CONN} max={DB_MAX_CONN}")
except Exception as e:
    print(f"Warning: could not create DB pool: {e}")
    DB_POOL = None

# Default user id header for simple multi-user behaviour (optional)
DEFAULT_USER_HEADER = 'X-User-Id'

@contextmanager
def get_conn():
    """Context manager that yields a connection and returns it to the pool."""
    if DB_POOL:
        conn = DB_POOL.getconn()
        try:
            yield conn
        finally:
            try:
                DB_POOL.putconn(conn)
            except Exception:
                try:
                    conn.close()
                except Exception:
                    pass
    else:
        # fallback to direct connection
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        try:
            yield conn
        finally:
            try:
                conn.close()
            except Exception:
                pass

def ensure_table():
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
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
    # Try to validate Supabase JWT from Authorization header first
    auth = request.headers.get('Authorization')
    if auth and auth.lower().startswith('bearer ') and SUPABASE_AUTH_USER_ENDPOINT:
        token = auth.split(' ', 1)[1].strip()
        try:
            # Ask Supabase auth endpoint for user info
            resp = requests.get(SUPABASE_AUTH_USER_ENDPOINT, headers={'Authorization': f'Bearer {token}'}, timeout=5)
            if resp.status_code == 200:
                user = resp.json()
                uid = user.get('id')
                if uid:
                    return uid
        except Exception as e:
            print('Warning: Supabase token validation failed', e)
    # Fallback to X-User-Id header (kept for compatibility / dev)
    user_id = request.headers.get(DEFAULT_USER_HEADER)
    if user_id:
        return user_id
    # Final fallback to DEV_AUTH_USER_ID env var or local-user
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
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
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
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
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
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
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
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
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
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
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
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute('DELETE FROM tasks WHERE user_id=%s', (user_id,))
                conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

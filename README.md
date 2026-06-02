# Task Manager App

Приложение для управления задачами с поддержкой календаря, тёмной темы и локальной базы данных PostgreSQL.

## Структура проекта

- `index.html` - HTML структура приложения
- `styles.css` - CSS стили
- `app.js` - JavaScript логика
- `server.py` - Flask бэкенд, использующий локальную PostgreSQL базу данных
- `requirements.txt` - Python зависимости
- `android_app/` - Android проект для сборки APK

## Запуск веб-версии

### 1. Настройка локальной PostgreSQL

1. Установите PostgreSQL и создайте базу данных, например:

```bash
sudo -u postgres psql -c "CREATE DATABASE tasksdb;"
sudo -u postgres psql -c "CREATE USER tasksuser WITH PASSWORD 'password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tasksdb TO tasksuser;"
```

2. Установите переменную окружения `DATABASE_URL`, например:

```bash
export DATABASE_URL='postgresql://tasksuser:password@localhost:5432/tasksdb'
```

3. Сервер автоматически создаст таблицу `tasks` при старте.

### 2. Установка зависимостей

```bash
pip3 install -r requirements.txt
```

### 3. Запуск сервера

```bash
python3 server.py
```

### 4. Откройте в браузере

http://localhost:5000

## База данных

Приложение использует локальную **PostgreSQL** базу данных для хранения задач.

Таблица `tasks` содержит следующие поля:
- `id` - уникальный идентификатор задачи (TEXT PRIMARY KEY)
- `title` - название задачи (TEXT NOT NULL)
- `date` - дата выполнения (TEXT NOT NULL)
- `time` - время выполнения (TEXT)
- `timer_minutes` - длительность таймера в минутах (INTEGER)
- `completed` - статус выполнения (BOOLEAN)
- `created_at` - дата создания (TEXT)

### Миграция с SQLite

Если у вас есть данные в SQLite (`tasks.db`), вы можете экспортировать их и импортировать в PostgreSQL:

```python
import sqlite3
import psycopg2
from psycopg2.extras import execute_values
import os

# Экспорт из SQLite
conn = sqlite3.connect('tasks.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()
cursor.execute('SELECT * FROM tasks')
tasks = [dict(row) for row in cursor.fetchall()]
conn.close()

# Импорт в Postgres
DATABASE_URL = os.getenv('DATABASE_URL')
with psycopg2.connect(DATABASE_URL) as pg:
    with pg.cursor() as cur:
        execute_values(cur, "INSERT INTO tasks (id,title,date,time,timer_minutes,completed,created_at,user_id) VALUES %s",
            [(t['id'],t['title'],t['date'],t.get('time',''),t.get('timer_minutes',0),bool(t.get('completed',False)),t.get('createdAt'),t.get('user_id')) for t in tasks])
        pg.commit()
```

## Сборка APK

Для сборки Android APK выполните:

```bash
./build_apk.sh
```

**Важно:** Для полной сборки APK требуется Android SDK и Build Tools.

Альтернативные способы создания APK:
1. **Cordova/Capacitor** - фреймворки для создания мобильных приложений из веб-кода
2. **Bubblewrap** - инструмент от Google для создания TWA (Trusted Web Activity)
3. **Android Studio** - импортируйте проект `android_app/` и соберите APK

## API Endpoints

- `GET /api/tasks` - получить все задачи
- `POST /api/tasks` - создать новую задачу
- `PUT /api/tasks/<id>` - обновить задачу
- `DELETE /api/tasks/<id>` - удалить задачу
- `POST /api/tasks/clear-completed` - очистить выполненные задачи за дату
- `POST /api/tasks/clear-all` - удалить все задачи

## Функции

- ✅ Создание, редактирование и удаление задач
- ✅ Отметка выполнения задач
- ✅ Календарь с отображением задач по дням
- ✅ Тёмная/светлая тема с динамическим переключением
- ✅ Отображение просроченных задач
- ✅ Локальная PostgreSQL база данных
- ✅ Возможна синхронизация при развертывании на общем сервере

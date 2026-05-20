# Task Manager App

Приложение для управления задачами с поддержкой календаря, тёмной темы и облачной базы данных Supabase.

## Структура проекта

- `index.html` - HTML структура приложения
- `styles.css` - CSS стили
- `app.js` - JavaScript логика
- `server.py` - Flask бэкенд с Supabase базой данных
- `supabase_config.js` - Конфигурация Supabase
- `supabase_schema.sql` - SQL схема для создания таблицы в Supabase
- `requirements.txt` - Python зависимости
- `android_app/` - Android проект для сборки APK

## Запуск веб-версии

### 1. Настройка Supabase

1. Зарегистрируйтесь на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Перейдите в SQL Editor и выполните скрипт из `supabase_schema.sql`
4. Получите credentials:
   - Project URL (например: `https://xxxxx.supabase.co`)
   - Anon/Public Key

5. Установите переменные окружения:
   ```bash
   export SUPABASE_URL='https://your-project-id.supabase.co'
   export SUPABASE_KEY='your-anon-key'
   ```
   
   Или создайте файл `.env`:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-anon-key
   ```

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

Приложение использует **Supabase** (PostgreSQL) для хранения задач в облаке.

Таблица `tasks` содержит следующие поля:
- `id` - уникальный идентификатор задачи (TEXT PRIMARY KEY)
- `title` - название задачи (TEXT NOT NULL)
- `date` - дата выполнения (TEXT NOT NULL)
- `time` - время выполнения (TEXT)
- `timer_minutes` - длительность таймера в минутах (INTEGER)
- `completed` - статус выполнения (BOOLEAN)
- `created_at` - дата создания (TEXT)

### Миграция с SQLite на Supabase

Если у вас есть данные в SQLite (`tasks.db`), вы можете экспортировать их и импортировать в Supabase:

```python
import sqlite3
import json
from supabase import create_client

# Экспорт из SQLite
conn = sqlite3.connect('tasks.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()
cursor.execute('SELECT * FROM tasks')
tasks = [dict(row) for row in cursor.fetchall()]
conn.close()

# Импорт в Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
for task in tasks:
    task['completed'] = bool(task['completed'])
    supabase.table('tasks').insert(task).execute()
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
- ✅ **Облачное хранение данных в Supabase**
- ✅ Синхронизация между устройствами

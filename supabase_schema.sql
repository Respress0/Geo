# SQL схема для создания таблицы в Supabase

-- Создайте таблицу tasks в вашем проекте Supabase через SQL Editor:

CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT DEFAULT '',
    timer_minutes INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    created_at TEXT NOT NULL
);

-- Добавьте индексы для оптимизации запросов (опционально):
CREATE INDEX idx_tasks_date ON tasks(date);
CREATE INDEX idx_tasks_completed ON tasks(completed);

-- Настройте Row Level Security (RLS) если нужно:
-- Для простого использования без аутентификации можно отключить RLS:
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Или создайте политику для публичного доступа:
-- CREATE POLICY "Public access" ON tasks FOR ALL USING (true);

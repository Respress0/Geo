-- =====================================================
-- СКРИПТ МИГРАЦИИ ДЛЯ ИЗОЛЯЦИИ ПОЛЬЗОВАТЕЛЕЙ
-- Выполнить в SQL Editor Supabase Dashboard
-- =====================================================

-- 1. Добавляем поле user_id для привязки задач к пользователю
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users;

-- 2. Заполняем существующие задачи NULL (или можно указать конкретного пользователя)
-- Если нужно назначить все существующие задачи конкретному пользователю:
-- UPDATE tasks SET user_id = 'ВАШ_USER_ID' WHERE user_id IS NULL;

-- 3. Включаем Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 4. Удаляем старые политики если есть
DROP POLICY IF EXISTS "Enable all access for all users" ON tasks;
DROP POLICY IF EXISTS "Users can see own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- 5. Создаём политики для изоляции пользователей
-- Политика на ЧТЕНИЕ: пользователь видит только свои задачи
CREATE POLICY "users_select_own_tasks" ON tasks
    FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Политика на INSERT: пользователь может создавать только задачи со своим user_id
CREATE POLICY "users_insert_own_tasks" ON tasks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Политика на UPDATE: пользователь может редактировать только свои задачи
CREATE POLICY "users_update_own_tasks" ON tasks
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Политика на DELETE: пользователь может удалять только свои задачи
CREATE POLICY "users_delete_own_tasks" ON tasks
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- ДОПОЛНИТЕЛЬНО: Индексы для производительности
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date);

-- =====================================================
-- ПРИМЕЧАНИЯ:
-- - auth.uid() возвращает ID текущего авторизованного пользователя
-- - Анонимные пользователи (anon) не смогут получать/создавать задачи
-- - Для работы требуется аутентификация через Supabase Auth
-- - Существующие задачи с user_id IS NULL будут видны всем до назначения
-- =====================================================

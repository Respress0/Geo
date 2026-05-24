# Руководство по настройке изоляции пользователей

## 📋 Что было сделано

### 1. Файл `.env`
Обновлён с актуальными значениями:
- `SUPABASE_URL` — URL проекта
- `SUPABASE_KEY` — anon key для клиентского доступа
- `SUPABASE_SERVICE_ROLE_KEY` — закомментирован, требуется для серверной валидации токенов

### 2. SQL миграция (`migration_add_user_isolation.sql`)
Скрипт для выполнения в Supabase SQL Editor:
- Добавляет поле `user_id UUID` в таблицу `tasks`
- Включает Row Level Security (RLS)
- Создаёт политики для изоляции пользователей

### 3. Сервер (`server.py`)
Обновлены все API endpoints:
- `GET /api/tasks` — возвращает только задачи текущего пользователя
- `POST /api/tasks` — создаёт задачу с `user_id` текущего пользователя
- `PUT /api/tasks/<id>` — обновляет только свои задачи
- `DELETE /api/tasks/<id>` — удаляет только свои задачи
- `POST /api/tasks/clear-completed` — очищает только свои выполненные
- `POST /api/tasks/clear-all` — удаляет только все свои задачи

---

## 🔧 Шаги настройки

### Шаг 1: Выполнить SQL миграцию
1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Скопируйте содержимое файла `migration_add_user_isolation.sql`
5. Нажмите **Run**

### Шаг 2: Получить Service Role Key
1. В Dashboard перейдите в **Settings** → **API**
2. Найдите секцию **Project API keys**
3. Скопируйте значение **service_role** (не anon!)
4. Вставьте в `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Шаг 3: Настроить клиентскую часть (app.js)
Требуется добавить аутентификацию Supabase Auth для получения токена.

Пример:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// После входа пользователя:
const { data: { user }, error } = await supabase.auth.getUser()

// Получение токена для отправки на сервер:
const { data: { session } } = await supabase.auth.getSession()
const token = session.access_token

// Использование в запросах:
fetch('/api/tasks', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

---

## 🔐 Как работает авторизация

### Анонимные пользователи (anon)
- **Без токена**: Все API возвращают `401 Authorization required`
- **С RLS политиками**: Не могут читать/писать задачи (нет `auth.uid()`)

### Авторизованные пользователи
1. Пользователь входит через Supabase Auth (email/password, OAuth и т.д.)
2. Клиент получает JWT токен (`access_token`)
3. Токен отправляется в заголовке `Authorization: Bearer <token>`
4. Сервер валидирует токен через `auth.get_user()`
5. Извлекается `user_id` и используется для фильтрации задач

### RLS политики (на уровне БД)
```sql
-- SELECT: видит только свои задачи
USING (auth.uid() = user_id)

-- INSERT: может создать только со своим user_id
WITH CHECK (auth.uid() = user_id)

-- UPDATE/DELETE: только свои задачи
USING (auth.uid() = user_id)
```

---

## ⚠️ Важные замечания

1. **Существующие задачи**: После миграции все старые задачи будут иметь `user_id = NULL`
   - Они видны всем до явного назначения владельца
   - Рекомендуется либо удалить их, либо назначить конкретному пользователю

2. **Service Role Key**: 
   - Никогда не используйте в клиентском коде
   - Храните только на сервере в `.env`
   - Дает полный доступ ко всем данным

3. **Тестирование**:
   - Без токена: все запросы должны возвращать 401
   - С токеном пользователя A: не видно задачи пользователя B
   - При попытке изменить чужую задачу: 404

---

## 📁 Список изменённых файлов

| Файл | Описание |
|------|----------|
| `.env` | Credentials Supabase |
| `server.py` | API с проверкой авторизации |
| `migration_add_user_isolation.sql` | SQL скрипт для БД |

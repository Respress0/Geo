# Промт: Создание приложения Task Manager с календарём и облачной синхронизацией

## Описание задачи

Создайте полнофункциональное веб-приложение для управления задачами (Task Manager) с поддержкой календаря, тёмной темы, таймера для задач и облачной синхронизации через Supabase. Приложение должно быть адаптировано для мобильных устройств и иметь возможность сборки в Android APK.

---

## Технические требования

### Стек технологий

**Frontend:**
- HTML5, CSS3 (CSS Variables для темизации)
- Vanilla JavaScript (без фреймворков)
- PWA (Progressive Web App) с manifest.json

**Backend:**
- Python + Flask
- Flask-CORS для поддержки CORS запросов
- Supabase Client для работы с PostgreSQL базой данных

**База данных:**
- Supabase (PostgreSQL)
- Таблица `tasks` с полями: id, title, date, time, timer_minutes, completed, created_at, user_id

**Мобильное приложение:**
- Android WebView приложение
- TWA (Trusted Web Activity) опционально

---

## Функциональные требования

### 1. Управление задачами

#### CRUD операции:
- **Создание задачи**: название, дата, время, длительность таймера (минуты)
- **Просмотр задач**: список задач на сегодня, задачи по выбранной дате
- **Редактирование задачи**: изменение всех полей задачи
- **Удаление задачи**: удаление отдельной задачи
- **Отметка выполнения**: чекбокс для отметки завершённых задач
- **Очистка выполненных**: кнопка для удаления всех выполненных задач за дату
- **Очистка всех данных**: кнопка для полного удаления всех задач

#### Дополнительные функции:
- Генерация UUID для уникальных идентификаторов задач
- Определение просроченных задач (дата < сегодня && не выполнено)
- Визуальное выделение просроченных задач (красная рамка)
- Автоматическое завершение задачи после истечения таймера

### 2. Календарь

- Отображение месяца с навигацией (предыдущий/следующий месяц)
- Сетка календаря с днями недели (Пн-Вс)
- Индикаторы наличия задач на день (точки под датой)
- Разные цвета индикаторов: обычный цвет - есть задачи, зелёный - все задачи выполнены
- Выделение текущего дня
- Возможность выбора дня для просмотра/добавления задач
- Отображение списка задач выбранного дня

### 3. Таймер задач

- Установка длительности таймера в минутах при создании задачи
- Запуск таймера из детального просмотра задачи
- Обратный отсчёт с отображением минут:секунд (MM:SS)
- Крупное отображение времени (48px шрифт)
- Кнопки "Запустить" и "Остановить"
- Уведомление об окончании таймера (alert)
- Автоматическая отметка задачи как выполненной после завершения таймера

### 4. Темизация

- Светлая и тёмная тема
- Переключатель тем в настройках (toggle switch)
- Сохранение выбора темы в localStorage
- Плавные переходы между темами (transition 0.3s)
- CSS Variables для всех цветовых схем

**Цветовая схема светлой темы:**
- Фон: #FFF8F0
- Карточки: #F5E6D3
- Акцент: #8B5A2B
- Текст: #3E2723
- Выполненные: #4CAF50
- Просроченные: #D32F2F

**Цветовая схема тёмной темы:**
- Фон: #2C2C2C
- Карточки: #3E3E3E
- Акцент: #D4A373
- Текст: #F5F5F5

### 5. Навигация и UI

#### Нижняя панель навигации (Tab Bar):
- 📋 Задачи - просмотр задач на сегодня
- 📅 Календарь - календарь с задачами
- ⚙️ Настройки - переключатель темы, очистка данных
- Фиксированная позиция внизу экрана
- Подсветка активной вкладки

#### Slide Panel (выезжающая панель):
- Анимация выезжания справа (transform translateX)
- Полупрозрачный фон с затемнением
- Панель создания новой задачи
- Панель детального просмотра задачи с таймером
- Закрытие по клику на фон или кнопку ✕

#### Карточки задач:
- Закруглённые углы (border-radius: 16px)
- Тень (box-shadow)
- Hover эффект (подъём при наведении)
- Чекбокс слева, название, дата, время, иконка таймера
- Кнопка удаления справа (🗑️)
- Клик на карточку открывает детальную информацию

---

## Структура проекта

```
project/
├── index.html              # Главная HTML страница
├── styles.css              # Все стили приложения
├── app.js                  # Frontend логика на JavaScript
├── server.py               # Flask backend с API
├── requirements.txt        # Python зависимости
├── supabase_schema.sql     # SQL схема базы данных
├── supabase_config.js      # Конфигурация Supabase
├── manifest.json           # PWA манифест
├── vercel.json             # Конфигурация для Vercel деплоя
├── android_app/            # Android проект
│   ├── AndroidManifest.xml
│   ├── MainActivity.java
│   └── assets/
│       ├── index.html
│       ├── styles.css
│       ├── app.js
│       └── server.py
└── static/                 # Статические файлы для веба
    ├── index.html
    ├── styles.css
    ├── app.js
    ├── manifest.json
    └── supabase_config.js
```

---

## API Endpoints

Все endpoints требуют авторизации через Bearer токен в заголовке Authorization.

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/tasks` | Получить все задачи текущего пользователя |
| POST | `/api/tasks` | Создать новую задачу |
| PUT | `/api/tasks/<id>` | Обновить задачу по ID |
| DELETE | `/api/tasks/<id>` | Удалить задачу по ID |
| POST | `/api/tasks/clear-completed` | Удалить выполненные задачи за дату |
| POST | `/api/tasks/clear-all` | Удалить все задачи пользователя |

### Формат данных задачи (JSON)

```json
{
  "id": "uuid-string",
  "title": "Название задачи",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "timer_minutes": 25,
  "completed": false,
  "created_at": "ISO-8601 timestamp",
  "user_id": "user-uuid"
}
```

---

## Схема базы данных (Supabase)

```sql
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT DEFAULT '',
    timer_minutes INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    created_at TEXT NOT NULL,
    user_id TEXT NOT NULL
);

-- Индексы для оптимизации
CREATE INDEX idx_tasks_date ON tasks(date);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Политика доступа: пользователи видят только свои задачи
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
    FOR DELETE USING (auth.uid()::text = user_id);
```

---

## Требования к реализации

### Frontend (JavaScript)

1. **Инициализация приложения:**
   - Загрузка задач из API при старте
   - Рендеринг начального вида (вкладка задач)
   - Загрузка сохранённой темы из localStorage

2. **Работа с API:**
   - Async/await для всех запросов
   - Обработка ошибок с выводом в консоль
   - Оптимистичное обновление UI (сначала UI, потом API)

3. **Рендеринг:**
   - Функция createTaskHTML() для генерации HTML карточки
   - Экранирование HTML в названии задачи (XSS защита)
   - Перерисовка при изменениях (tasks tab, calendar, selected day)

4. **Таймер:**
   - setInterval для обратного отсчёта
   - Форматирование MM:SS с ведущими нулями
   - Остановка при закрытии модального окна

### Backend (Flask + Python)

1. **Настройка:**
   - Flask app со статической папкой
   - CORS включён для всех origins
   - Переменные окружения для Supabase credentials

2. **Авторизация:**
   - Извлечение Bearer токена из заголовка Authorization
   - Валидация токена через Supabase Admin API (service role key)
   - Получение user_id из токена

3. **Безопасность:**
   - Проверка принадлежности задачи пользователю перед обновлением/удалением
   - Возврат 401 при отсутствии авторизации
   - Возврат 404 при попытке доступа к чужой задаче

4. **Обработка данных:**
   - Преобразование boolean completed для совместимости
   - Сортировка задач по дате и времени создания

### Styling (CSS)

1. **CSS Variables:**
   - Все цвета через var(--variable-name)
   - Отдельные переменные для светлой и тёмной темы
   - Атрибут data-theme="dark" для переключения

2. **Адаптивность:**
   - Mobile-first подход
   - Media queries для экранов < 480px
   - Padding и font-size уменьшаются на мобильных

3. **Анимации:**
   - Transition для темизации (0.3s)
   - Transform для hover эффектов карточек
   - Slide animation для выездных панелей

---

## Настройка окружения

### Переменные окружения

```bash
export SUPABASE_URL='https://your-project-id.supabase.co'
export SUPABASE_KEY='your-anon-key'
export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'
```

### Установка зависимостей

```bash
pip install flask flask-cors supabase
```

### Запуск сервера

```bash
python server.py
```

Приложение доступно по адресу: http://localhost:5000

---

## Деплой

### Vercel

1. Создайте файл `vercel.json`:
```json
{
  "version": 2,
  "builds": [{ "src": "server.py", "use": "@vercel/python" }],
  "routes": [{ "src": "/(.*)", "dest": "server.py" }]
}
```

2. Добавьте переменные окружения в панели Vercel

### TWA (Trusted Web Activity)

Используйте Bubblewrap для создания TWA:
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://your-app-url.com/manifest.json
bubblewrap build
```

---

## Дополнительные улучшения

### Рекомендуемые функции для добавления:

1. **Push уведомления** - напоминания о задачах
2. **Повторяющиеся задачи** - ежедневные, еженедельные, ежемесячные
3. **Категории/теги** - группировка задач по категориям
4. **Приоритеты** - высокий, средний, низкий приоритет задач
5. **Заметки к задачам** - подробное описание задачи
6. **Вложения файлов** - фото, документы к задачам
7. **Совместный доступ** - шаринг задач с другими пользователями
8. **Экспорт/Импорт** - CSV, JSON экспорт данных
9. **Статистика** - графики выполнения задач
10. **Голосовой ввод** - создание задач голосом

### Оптимизации:

1. **Service Worker** - offline режим, кэширование
2. **IndexedDB** - локальное хранилище для offline работы
3. **Lazy loading** - подгрузка задач по мере необходимости
4. **Virtual scrolling** - для больших списков задач
5. **Debounce** - для поисковых запросов и фильтрации

---

## Тестирование

### Чек-лист функциональности:

- [ ] Создание задачи со всеми полями
- [ ] Редактирование существующей задачи
- [ ] Удаление задачи
- [ ] Отметка выполнения задачи
- [ ] Очистка выполненных задач
- [ ] Очистка всех данных
- [ ] Переключение между вкладками (Задачи, Календарь, Настройки)
- [ ] Навигация по календарю (месяцы)
- [ ] Выбор даты в календаре
- [ ] Отображение индикаторов задач на календаре
- [ ] Запуск таймера задачи
- [ ] Остановка таймера
- [ ] Завершение задачи по таймеру
- [ ] Переключение светлой/тёмной темы
- [ ] Сохранение темы после перезагрузки
- [ ] Отображение просроченных задач
- [ ] Адаптивность на мобильных устройствах
- [ ] Работа PWA (установка на домашний экран)

---

## Примеры кода ключевых функций

### Генерация UUID

```javascript
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

### Проверка просроченной задачи

```javascript
function isTaskOverdue(task) {
  const today = new Date().toISOString().split('T')[0];
  return task.date < today && !task.completed;
}
```

### Таймер с обратным отсчётом

```javascript
function startTimer() {
  timerSecondsRemaining = currentTask.timer_minutes * 60;
  timerInterval = setInterval(() => {
    timerSecondsRemaining--;
    updateTimerDisplay();
    if (timerSecondsRemaining <= 0) {
      clearInterval(timerInterval);
      timerFinished();
    }
  }, 1000);
}
```

### Переключение темы

```javascript
function toggleTheme() {
  const isDark = document.getElementById('theme-toggle').checked;
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  }
}
```

---

## Заключение

Данное приложение представляет собой полноценный менеджер задач с современным UI, поддержкой мобильных устройств и облачной синхронизацией. Архитектура позволяет легко расширять функциональность и адаптировать приложение под различные платформы (Web, Android, iOS).

Ключевые преимущества:
- ✅ Простота и скорость работы (Vanilla JS, нет тяжёлых фреймворков)
- ✅ Offline-first подход (локальное состояние + синхронизация)
- ✅ Кроссплатформенность (Web + Android)
- ✅ Безопасность (RLS, авторизация, изоляция пользователей)
- ✅ Современный UX (анимации, тёмная тема, PWA)

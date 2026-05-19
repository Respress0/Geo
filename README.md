# Task Manager App

Приложение для управления задачами с поддержкой календаря и тёмной темы.

## Структура проекта

- `index.html` - HTML структура приложения
- `styles.css` - CSS стили
- `app.js` - JavaScript логика
- `server.py` - Flask бэкенд с SQLite базой данных
- `android_app/` - Android проект для сборки APK

## Запуск веб-версии

1. Установите зависимости:
   ```bash
   pip3 install flask flask-cors
   ```

2. Запустите сервер:
   ```bash
   python3 server.py
   ```

3. Откройте в браузере: http://localhost:5000

## База данных

Приложение использует SQLite базу данных (`tasks.db`) для хранения задач.
Таблица `tasks` содержит следующие поля:
- `id` - уникальный идентификатор задачи
- `title` - название задачи
- `date` - дата выполнения
- `completed` - статус выполнения (0/1)
- `created_at` - дата создания

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
- `POST /api/tasks/clear-completed` - очистить выполненные задачи
- `POST /api/tasks/clear-all` - удалить все задачи

## Функции

- ✅ Создание, редактирование и удаление задач
- ✅ Отметка выполнения задач
- ✅ Календарь с отображением задач по дням
- ✅ Тёмная тема
- ✅ Отображение просроченных задач
- ✅ Хранение данных в SQLite базе

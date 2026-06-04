let appData = { tasks: [] };
let currentCalendarDate = new Date();
let selectedDate = null;
let currentTask = null;
let timerInterval = null;
let timerSecondsRemaining = 0;

const API_BASE = '/api';

async function init() {
  await loadData();
  renderTasksTab();
  renderCalendar();
  loadTheme();
  updateTasksTitle();
}

async function loadData() {
  try {
    const response = await fetch(`${API_BASE}/tasks`);
    const tasks = await response.json();
    appData.tasks = tasks.map(task => ({
      ...task,
      completed: task.completed === true || task.completed === 1
    }));
  } catch (error) {
    console.error('Error loading tasks:', error);
    appData.tasks = [];
  }
}

async function saveTaskToDB(task) {
  try {
    await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
  } catch (error) {
    console.error('Error saving task:', error);
  }
}

async function updateTaskInDB(taskId, task) {
  try {
    await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
  } catch (error) {
    console.error('Error updating task:', error);
  }
}

async function deleteTaskFromDB(taskId) {
  try {
    await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
  }
}

async function clearCompletedFromDB(today) {
  try {
    await fetch(`${API_BASE}/tasks/clear-completed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ today })
    });
  } catch (error) {
    console.error('Error clearing completed tasks:', error);
  }
}

async function clearAllFromDB() {
  try {
    await fetch(`${API_BASE}/tasks/clear-all`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('Error clearing all tasks:', error);
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabName + '-tab').classList.add('active');
  event.target.classList.add('active');
  if (tabName === 'tasks') { renderTasksTab(); updateTasksTitle(); }
  else if (tabName === 'calendar') renderCalendar();
}

function updateTasksTitle() {
  const today = new Date();
  document.getElementById('tasks-title').textContent = 'Задачи на ' + formatDate(today);
}

function renderTasksTab() {
  const today = new Date().toISOString().split('T')[0];
  const tasksList = document.getElementById('tasks-list');
  const todayTasks = appData.tasks.filter(task => task.date === today);
  if (todayTasks.length === 0) {
    tasksList.innerHTML = '<p style="text-align: center; opacity: 0.6; padding: 20px;">Нет задач на сегодня</p>';
    return;
  }
  tasksList.innerHTML = todayTasks.map(task => createTaskHTML(task)).join('');
}

function createTaskHTML(task) {
  const isOverdue = isTaskOverdue(task);
  const overdueClass = isOverdue ? 'overdue' : '';
  const completedClass = task.completed ? 'completed' : '';
  const overdueText = isOverdue ? '<span class="overdue-text"> (Просрочено)</span>' : '';
  const timeText = task.time ? `<span class="task-time">⏰ ${task.time}</span>` : '';
  const timerText = task.timer_minutes > 0 ? `<span class="task-timer">⏱️ ${task.timer_minutes} мин</span>` : '';
  return '<div class="card ' + overdueClass + '" onclick="openTaskDetailModal(\'' + task.id + '\')">' +
    '<input type="checkbox" class="task-checkbox" ' + (task.completed ? 'checked' : '') + ' onclick="event.stopPropagation(); toggleTaskCompletion(\'' + task.id + '\')">' +
    '<span class="task-title ' + completedClass + '">' + escapeHTML(task.title) + overdueText + '</span>' +
    '<span class="task-date">' + formatDate(new Date(task.date)) + '</span>' +
    timeText + timerText +
    '<button class="delete-btn" onclick="event.stopPropagation(); deleteTask(\'' + task.id + '\')">🗑️</button>' +
    '</div>';
}

function toggleTaskCompletion(taskId) {
  const task = appData.tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    updateTaskInDB(taskId, task);
    renderTasksTab();
    renderCalendar();
    if (selectedDate) renderSelectedDayTasks();
  }
}

function deleteTask(taskId) {
  appData.tasks = appData.tasks.filter(t => t.id !== taskId);
  deleteTaskFromDB(taskId);
  renderTasksTab();
  renderCalendar();
  if (selectedDate) renderSelectedDayTasks();
}

function clearCompletedTasks() {
  const today = new Date().toISOString().split('T')[0];
  appData.tasks = appData.tasks.filter(task => !(task.date === today && task.completed));
  clearCompletedFromDB(today);
  renderTasksTab();
}

function isTaskOverdue(task) {
  const today = new Date().toISOString().split('T')[0];
  return task.date < today && !task.completed;
}

function openNewTaskModal() {
  document.getElementById('new-task-modal').classList.add('active');
  document.getElementById('task-title-input').value = '';
  document.getElementById('task-date-input').value = new Date().toISOString().split('T')[0];
  // по умолчанию ставим 00 часов
  document.getElementById('task-time-input').value = '00:00';
  document.getElementById('task-timer-input').value = '';
  document.getElementById('task-title-input').focus();
}

function closeNewTaskModal() {
  document.getElementById('new-task-modal').classList.remove('active');
}

function createTask() {
  const title = document.getElementById('task-title-input').value.trim();
  const date = document.getElementById('task-date-input').value;
  let time = document.getElementById('task-time-input').value;
  // Нормализуем: если пользователь ввёл только минуты (например "30"), добавим 00 часов.
  if (time && !time.includes(':')) {
    time = '00:' + String(time).padStart(2, '0');
  }
  const timerMinutes = parseInt(document.getElementById('task-timer-input').value) || 0;
  if (!title) {
    document.getElementById('task-title-input').focus();
    return;
  }
  const newTask = {
    id: generateUUID(),
    title: title,
    date: date || new Date().toISOString().split('T')[0],
    time: time || '',
    timer_minutes: timerMinutes,
    completed: false,
    createdAt: new Date().toISOString()
  };
  appData.tasks.push(newTask);
  saveTaskToDB(newTask);
  closeNewTaskModal();
  renderTasksTab();
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const monthYear = document.getElementById('calendar-month-year');
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  monthYear.textContent = new Date(year, month).toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDay = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  let html = dayNames.map(name => '<div class="calendar-day-name">' + name + '</div>').join('');
  for (let i = 0; i < startingDay; i++) html += '<div class="calendar-day empty"></div>';
  const today = new Date().toISOString().split('T')[0];
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    const dayTasks = appData.tasks.filter(t => t.date === dateStr);
    const completedTasks = dayTasks.filter(t => t.completed);
    const isToday = dateStr === today;
    const isSelected = selectedDate === dateStr;
    let markerHTML = '';
    if (dayTasks.length > 0) {
      const allCompleted = completedTasks.length === dayTasks.length;
      const markerClass = allCompleted ? 'completed' : '';
      markerHTML = '<div class="calendar-day-marker"><span class="marker-dot ' + markerClass + '"></span><span>' + dayTasks.length + '</span></div>';
    }
    html += '<div class="calendar-day ' + (isToday ? 'today' : '') + ' ' + (isSelected ? 'selected' : '') + '" onclick="selectDate(\'' + dateStr + '\')">' +
      '<span class="calendar-day-number">' + day + '</span>' + markerHTML + '</div>';
  }
  grid.innerHTML = html;
  if (selectedDate) renderSelectedDayTasks();
}

function previousMonth() { currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1); renderCalendar(); }
function nextMonth() { currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1); renderCalendar(); }
function selectDate(dateStr) { selectedDate = dateStr; renderCalendar(); }

function renderSelectedDayTasks() {
  const container = document.getElementById('selected-day-tasks');
  if (!selectedDate) { container.innerHTML = ''; return; }
  const dayTasks = appData.tasks.filter(t => t.date === selectedDate);
  let html = '<h3>Задачи на ' + formatDate(new Date(selectedDate)) + '</h3>';
  if (dayTasks.length === 0) {
    html += '<p style="text-align: center; opacity: 0.6; padding: 20px;">Нет задач на этот день</p>';
  } else {
    html += dayTasks.map(task => createTaskHTML(task)).join('');
  }
  html += '<button class="btn" onclick="openNewTaskModalForDate(\'' + selectedDate + '\')">+ Добавить задачу</button>';
  container.innerHTML = html;
}

function openNewTaskModalForDate(date) { openNewTaskModal(); document.getElementById('task-date-input').value = date; }

function loadTheme() {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('theme-toggle').checked = true;
    document.getElementById('theme-label').textContent = 'Светлая тема';
  } else {
    document.getElementById('theme-label').textContent = 'Тёмная тема';
  }
}

function toggleTheme() {
  const isDark = document.getElementById('theme-toggle').checked;
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    document.getElementById('theme-label').textContent = 'Светлая тема';
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    document.getElementById('theme-label').textContent = 'Тёмная тема';
  }
}

function clearAllData() {
  if (confirm('Вы уверены? Все задачи будут удалены безвозвратно.')) {
    appData.tasks = [];
    clearAllFromDB();
    renderTasksTab();
    renderCalendar();
    selectedDate = null;
    document.getElementById('selected-day-tasks').innerHTML = '';
    alert('Все данные очищены');
  }
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return day + '.' + month + '.' + year;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function openTaskDetailModal(taskId) {
  const task = appData.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  currentTask = task;
  
  document.getElementById('task-detail-title').textContent = task.title;
  document.getElementById('task-detail-date').textContent = 'Дата: ' + formatDate(new Date(task.date));
  document.getElementById('task-detail-time').textContent = task.time ? 'Время: ' + task.time : '';
  document.getElementById('task-detail-timer').textContent = task.timer_minutes > 0 ? 'Таймер: ' + task.timer_minutes + ' мин' : '';
  
  const startTimerBtn = document.getElementById('start-timer-btn');
  const stopTimerBtn = document.getElementById('stop-timer-btn');
  const timerDisplay = document.getElementById('timer-display');
  
  if (task.timer_minutes > 0 && !task.completed) {
    startTimerBtn.style.display = 'inline-block';
    stopTimerBtn.style.display = 'none';
    timerDisplay.style.display = 'none';
  } else {
    startTimerBtn.style.display = 'none';
    stopTimerBtn.style.display = 'none';
    timerDisplay.style.display = 'none';
  }
  
  document.getElementById('task-detail-modal').classList.add('active');
}

function closeTaskDetailModal() {
  document.getElementById('task-detail-modal').classList.remove('active');
  stopTimer();
  currentTask = null;
}

function startTimer() {
  if (!currentTask || currentTask.timer_minutes <= 0) return;
  
  timerSecondsRemaining = currentTask.timer_minutes * 60;
  
  document.getElementById('timer-display').style.display = 'block';
  document.getElementById('start-timer-btn').style.display = 'none';
  document.getElementById('stop-timer-btn').style.display = 'inline-block';
  
  updateTimerDisplay();
  
  timerInterval = setInterval(() => {
    timerSecondsRemaining--;
    updateTimerDisplay();
    
    if (timerSecondsRemaining <= 0) {
      clearInterval(timerInterval);
      timerFinished();
    }
  }, 1000);
}

function startTimerForTask(task) {
  if (!task || task.timer_minutes <= 0) return;
  if (task._timerStarted) return; // prevent duplicate starts
  // set currentTask and open modal for visibility
  currentTask = task;
  task._timerStarted = true;
  openTaskDetailModal(task.id);
  startTimer();
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  document.getElementById('timer-display').style.display = 'none';
  document.getElementById('start-timer-btn').style.display = 'none';
  document.getElementById('stop-timer-btn').style.display = 'none';
  if (currentTask) {
    currentTask._timerStarted = false;
  }
}

function updateTimerDisplay() {
  const minutes = Math.floor(timerSecondsRemaining / 60);
  const seconds = timerSecondsRemaining % 60;
  const displayStr = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
  document.getElementById('timer-countdown').textContent = displayStr;
}

function timerFinished() {
  alert('Таймер завершен! Задача автоматически помечается как выполненная.');
  
  if (currentTask) {
    currentTask.completed = true;
    updateTaskInDB(currentTask.id, currentTask);
    renderTasksTab();
    renderCalendar();
    if (selectedDate) renderSelectedDayTasks();
  }
  
  stopTimer();
  closeTaskDetailModal();
}

// Auto-start timers: check every 30 seconds whether any task time matches local time
function checkAutoStartTimers() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const timeNow = hh + ':' + mm;
  appData.tasks.forEach(task => {
    if (!task) return;
    // task.time is expected in 'HH:MM' format
    if (task.time && task.time === timeNow && !task.completed && task.timer_minutes > 0 && !task._timerStarted) {
      // start timer for this task
      startTimerForTask(task);
    }
  });
}

// start periodic check
setInterval(checkAutoStartTimers, 30000);

document.getElementById('task-title-input').addEventListener('keypress', function(e) { if (e.key === 'Enter') createTask(); });
document.getElementById('new-task-modal').addEventListener('click', function(e) { if (e.target === this) closeNewTaskModal(); });
document.getElementById('task-detail-modal').addEventListener('click', function(e) { if (e.target === this) closeTaskDetailModal(); });

init();

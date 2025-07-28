document.addEventListener('DOMContentLoaded', function() {
  // Инициализация приложения
  initApp();
  
  // Обработчики событий
  setupTabNavigation();
  setupModal();
  
  // Загружаем начальный экран
  loadTabContent('feed');
});

// Инициализация данных
function initApp() {
  if (!localStorage.getItem('events')) {
    const sampleEvents = [
      {
        id: 1,
        title: 'Встреча разработчиков',
        description: 'Обсуждение нового проекта и технологий',
        date: '2023-12-15T18:00',
        location: 'Коворкинг "Цифровой"',
        creator: 'dev_user',
        isBookmarked: false
      },
      {
        id: 2,
        title: 'Мастер-класс по дизайну',
        description: 'Основы UI/UX дизайна для начинающих',
        date: '2023-12-20T15:00',
        location: 'Онлайн',
        creator: 'design_pro',
        isBookmarked: true
      },
      {
        id: 3,
        title: 'Йога в парке',
        description: 'Открытый урок йоги для всех желающих',
        date: '2023-12-10T09:00',
        location: 'Центральный парк',
        creator: 'yoga_master',
        isBookmarked: false
      }
    ];
    localStorage.setItem('events', JSON.stringify(sampleEvents));
  }
  
  if (!localStorage.getItem('user')) {
    const user = {
      id: 'tg_user_123',
      name: 'Telegram User',
      username: 'tguser',
      isPremium: false,
      createdEvents: [1],
      joinedEvents: [2]
    };
    localStorage.setItem('user', JSON.stringify(user));
  }
}

// Навигация по табам
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Удаляем активный класс у всех кнопок
      tabButtons.forEach(btn => btn.classList.remove('active'));
      // Добавляем активный класс текущей кнопке
      this.classList.add('active');
      // Загружаем контент для выбранного таба
      const tabName = this.getAttribute('data-tab');
      loadTabContent(tabName);
    });
  });
}

// Загрузка контента для таба
function loadTabContent(tabName) {
  const appContent = document.getElementById('appContent');
  
  switch(tabName) {
    case 'feed':
      appContent.innerHTML = renderEventFeed();
      setupEventCards();
      break;
    case 'calendar':
      appContent.innerHTML = renderCalendar();
      setupCalendar();
      break;
    case 'create':
      appContent.innerHTML = renderCreateEventForm();
      setupEventForm();
      break;
    case 'my-events':
      appContent.innerHTML = renderMyEvents();
      setupMyEvents();
      break;
    case 'account':
      appContent.innerHTML = renderAccount();
      setupAccount();
      break;
    default:
      appContent.innerHTML = '<p>Контент не найден</p>';
  }
}

// Рендер ленты событий
function renderEventFeed() {
  const events = JSON.parse(localStorage.getItem('events'));
  
  let html = `
    <div class="feed-header">
      <h2>Лента событий</h2>
      <div class="search-filter">
        <input type="text" placeholder="Поиск событий..." class="form-control">
        <button class="btn btn-outline">Фильтры</button>
      </div>
      <div class="view-toggle">
        <button class="btn btn-outline active"><i class="fas fa-list"></i> Список</button>
        <button class="btn btn-outline"><i class="fas fa-map-marker-alt"></i> Карта</button>
      </div>
    </div>
    <div class="event-list">
  `;
  
  events.forEach(event => {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    html += `
      <div class="event-card" data-id="${event.id}">
        <h3 class="event-title">${event.title}</h3>
        <div class="event-date">${formattedDate}</div>
        <div class="event-location">
          <i class="fas fa-map-marker-alt"></i> ${event.location}
        </div>
        <div class="event-actions">
          <button class="btn btn-outline btn-bookmark" data-id="${event.id}">
            ${event.isBookmarked ? '<i class="fas fa-bookmark"></i>' : '<i class="far fa-bookmark"></i>'}
          </button>
          <button class="btn btn-primary">Участвовать</button>
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  return html;
}

// Рендер календаря
function renderCalendar() {
  const currentDate = new Date();
  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  
  let html = `
    <div class="calendar-header">
      <h2>${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}</h2>
      <div>
        <button class="btn btn-outline" id="prevMonth"><i class="fas fa-chevron-left"></i></button>
        <button class="btn btn-outline" id="nextMonth"><i class="fas fa-chevron-right"></i></button>
      </div>
    </div>
    <div class="calendar-grid">
      <div class="calendar-day-header">Пн</div>
      <div class="calendar-day-header">Вт</div>
      <div class="calendar-day-header">Ср</div>
      <div class="calendar-day-header">Чт</div>
      <div class="calendar-day-header">Пт</div>
      <div class="calendar-day-header">Сб</div>
      <div class="calendar-day-header">Вс</div>
  `;
  
  // Генерация дней календаря
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Пустые ячейки для дней предыдущего месяца
  for (let i = 0; i < firstDay.getDay(); i++) {
    html += `<div class="calendar-day empty"></div>`;
  }
  
  // Дни текущего месяца
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    const isToday = dayDate.toDateString() === new Date().toDateString();
    const hasEvents = Math.random() > 0.7; // Для демо - случайные события
    
    html += `
      <div class="calendar-day ${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : ''}" data-date="${dayDate.toISOString()}">
        ${i}
      </div>
    `;
  }
  
  html += `</div>`;
  return html;
}

// Рендер формы создания события
function renderCreateEventForm() {
  return `
    <h2>Создать событие</h2>
    <form id="eventForm">
      <div class="form-group">
        <label for="eventTitle">Название события</label>
        <input type="text" id="eventTitle" class="form-control" required>
      </div>
      <div class="form-group">
        <label for="eventDescription">Описание</label>
        <textarea id="eventDescription" class="form-control"></textarea>
      </div>
      <div class="form-group">
        <label for="eventDate">Дата и время</label>
        <input type="datetime-local" id="eventDate" class="form-control" required>
      </div>
      <div class="form-group">
        <label for="eventLocation">Местоположение</label>
        <input type="text" id="eventLocation" class="form-control" required>
      </div>
      <button type="submit" class="btn btn-primary">Создать событие</button>
    </form>
  `;
}

// Рендер "Мои события"
function renderMyEvents() {
  const user = JSON.parse(localStorage.getItem('user'));
  const events = JSON.parse(localStorage.getItem('events'));
  
  const createdEvents = events.filter(e => user.createdEvents.includes(e.id));
  const joinedEvents = events.filter(e => user.joinedEvents.includes(e.id));
  const bookmarkedEvents = events.filter(e => e.isBookmarked);
  
  return `
    <div class="my-events-tabs">
      <div class="tab-buttons">
        <button class="btn btn-outline active" data-tab="created">Созданные</button>
        <button class="btn btn-outline" data-tab="joined">Участвую</button>
        <button class="btn btn-outline" data-tab="bookmarked">Закладки</button>
      </div>
      
      <div id="createdEvents" class="event-tab-content">
        <h3>Созданные события</h3>
        <div class="event-list">
          ${createdEvents.map(event => renderEventCard(event)).join('')}
        </div>
      </div>
      
      <div id="joinedEvents" class="event-tab-content" style="display:none">
        <h3>События, в которых участвую</h3>
        <div class="event-list">
          ${joinedEvents.map(event => renderEventCard(event)).join('')}
        </div>
      </div>
      
      <div id="bookmarkedEvents" class="event-tab-content" style="display:none">
        <h3>События в закладках</h3>
        <div class="event-list">
          ${bookmarkedEvents.map(event => renderEventCard(event)).join('')}
        </div>
      </div>
    </div>
  `;
}

// Рендер карточки события (для "Мои события")
function renderEventCard(event) {
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `
    <div class="event-card" data-id="${event.id}">
      <h3 class="event-title">${event.title}</h3>
      <div class="event-date">${formattedDate}</div>
      <div class="event-location">
        <i class="fas fa-map-marker-alt"></i> ${event.location}
      </div>
    </div>
  `;
}

// Рендер аккаунта
function renderAccount() {
  const user = JSON.parse(localStorage.getItem('user'));
  const events = JSON.parse(localStorage.getItem('events'));
  
  const createdCount = user.createdEvents.length;
  const joinedCount = user.joinedEvents.length;
  
  return `
    <div class="account-info">
      <div class="user-profile">
        <div class="avatar-large">${user.name.charAt(0)}</div>
        <h2>${user.name}</h2>
        <div class="username">@${user.username}</div>
      </div>
      
      <div class="stats">
        <div class="stat-card">
          <div class="stat-value">${createdCount}</div>
          <div class="stat-label">Создано событий</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${joinedCount}</div>
          <div class="stat-label">Участвовал</div>
        </div>
      </div>
      
      <div class="premium-section">
        <h3>Премиум подписка</h3>
        <p>${user.isPremium ? 'У вас активна премиум подписка' : 'Получите дополнительные возможности'}</p>
        <button class="btn ${user.isPremium ? 'btn-outline' : 'btn-primary'}" id="premiumBtn">
          ${user.isPremium ? 'Управление подпиской' : 'Оформить премиум'}
        </button>
      </div>
    </div>
  `;
}

// Настройка карточек событий
function setupEventCards() {
  document.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('click', function() {
      const eventId = parseInt(this.getAttribute('data-id'));
      showEventDetails(eventId);
    });
  });
  
  document.querySelectorAll('.btn-bookmark').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const eventId = parseInt(this.getAttribute('data-id'));
      toggleBookmark(eventId);
      this.innerHTML = isEventBookmarked(eventId) ? '<i class="fas fa-bookmark"></i>' : '<i class="far fa-bookmark"></i>';
    });
  });
}

// Настройка календаря
function setupCalendar() {
  document.getElementById('prevMonth').addEventListener('click', function() {
    // В реальном приложении здесь будет переход к предыдущему месяцу
    alert('Переход к предыдущему месяцу');
  });
  
  document.getElementById('nextMonth').addEventListener('click', function() {
    // В реальном приложении здесь будет переход к следующему месяцу
    alert('Переход к следующему месяцу');
  });
  
  document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
    day.addEventListener('click', function() {
      const date = new Date(this.getAttribute('data-date'));
      alert(`Выбрана дата: ${date.toLocaleDateString('ru-RU')}`);
    });
  });
}

// Настройка формы создания события
function setupEventForm() {
  document.getElementById('eventForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('eventTitle').value;
    const description = document.getElementById('eventDescription').value;
    const date = document.getElementById('eventDate').value;
    const location = document.getElementById('eventLocation').value;
    
    if (!title || !date || !location) {
      alert('Пожалуйста, заполните обязательные поля');
      return;
    }
    
    const events = JSON.parse(localStorage.getItem('events'));
    const user = JSON.parse(localStorage.getItem('user'));
    
    const newEvent = {
      id: events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1,
      title,
      description,
      date: new Date(date).toISOString(),
      location,
      creator: user.username,
      isBookmarked: false
    };
    
    events.push(newEvent);
    localStorage.setItem('events', JSON.stringify(events));
    
    user.createdEvents.push(newEvent.id);
    localStorage.setItem('user', JSON.stringify(user));
    
    alert('Событие успешно создано!');
    this.reset();
  });
}

// Настройка "Мои события"
function setupMyEvents() {
  document.querySelectorAll('.my-events-tabs .btn-outline').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.my-events-tabs .btn-outline').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      document.querySelectorAll('.event-tab-content').forEach(content => {
        content.style.display = 'none';
      });
      
      const tabName = this.getAttribute('data-tab');
      document.getElementById(`${tabName}Events`).style.display = 'block';
    });
  });
  
  document.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('click', function() {
      const eventId = parseInt(this.getAttribute('data-id'));
      showEventDetails(eventId);
    });
  });
}

// Настройка аккаунта
function setupAccount() {
  document.getElementById('premiumBtn').addEventListener('click', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (user.isPremium) {
      alert('Управление премиум подпиской');
    } else {
      if (confirm('Оформить премиум подписку за 299₽ в месяц?')) {
        user.isPremium = true;
        localStorage.setItem('user', JSON.stringify(user));
        alert('Поздравляем! Теперь у вас есть премиум подписка!');
        loadTabContent('account'); // Перезагружаем экран
      }
    }
  });
}

// Модальное окно с деталями события
function setupModal() {
  const modal = document.getElementById('eventModal');
  const closeBtn = document.querySelector('.close-btn');
  
  closeBtn.addEventListener('click', function() {
    modal.style.display = 'none';
  });
  
  window.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

// Показать детали события
function showEventDetails(eventId) {
  const events = JSON.parse(localStorage.getItem('events'));
  const event = events.find(e => e.id === eventId);
  
  if (!event) return;
  
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const modal = document.getElementById('eventModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  
  modalTitle.textContent = event.title;
  
  modalBody.innerHTML = `
    <div class="event-detail">
      <div class="detail-row">
        <i class="fas fa-calendar-alt"></i>
        <span>${formattedDate}</span>
      </div>
      <div class="detail-row">
        <i class="fas fa-map-marker-alt"></i>
        <span>${event.location}</span>
      </div>
      <div class="detail-row">
        <i class="fas fa-user"></i>
        <span>Организатор: ${event.creator}</span>
      </div>
      <div class="event-description">
        <h4>Описание</h4>
        <p>${event.description || 'Описание отсутствует'}</p>
      </div>
      <div class="event-actions">
        <button class="btn ${isEventBookmarked(event.id) ? 'btn-primary' : 'btn-outline'}" id="modalBookmarkBtn">
          ${isEventBookmarked(event.id) ? '<i class="fas fa-bookmark"></i> В закладках' : '<i class="far fa-bookmark"></i> В закладки'}
        </button>
        <button class="btn btn-primary">Участвовать</button>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
  
  document.getElementById('modalBookmarkBtn').addEventListener('click', function() {
    toggleBookmark(event.id);
    this.innerHTML = isEventBookmarked(event.id) ? '<i class="fas fa-bookmark"></i> В закладках' : '<i class="far fa-bookmark"></i> В закладки';
    this.className = isEventBookmarked(event.id) ? 'btn btn-primary' : 'btn btn-outline';
    
    // Обновляем ленту событий, если она открыта
    const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
    if (activeTab === 'feed' || activeTab === 'my-events') {
      loadTabContent(activeTab);
    }
  });
}

// Проверка, есть ли событие в закладках
function isEventBookmarked(eventId) {
  const events = JSON.parse(localStorage.getItem('events'));
  const event = events.find(e => e.id === eventId);
  return event ? event.isBookmarked : false;
}

// Переключение закладки
function toggleBookmark(eventId) {
  const events = JSON.parse(localStorage.getItem('events'));
  const eventIndex = events.findIndex(e => e.id === eventId);
  
  if (eventIndex !== -1) {
    events[eventIndex].isBookmarked = !events[eventIndex].isBookmarked;
    localStorage.setItem('events', JSON.stringify(events));
  }
}

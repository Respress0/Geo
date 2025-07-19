const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let currentPoint = null; // Текущая выбранная точка { lat, lng }

wss.on('connection', (ws) => {
  console.log('Новое подключение');
  
  // Отправляем текущую точку новому клиенту
  if (currentPoint) {
    ws.send(JSON.stringify(currentPoint));
  }

  // Обработка новых сообщений от клиентов
  ws.on('message', (message) => {
    try {
      const point = JSON.parse(message);
      currentPoint = point; // Обновляем точку
      
      // Рассылаем всем клиентам
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(point));
        }
      });
    } catch (e) {
      console.error('Ошибка парсинга:', e);
    }
  });

  ws.on('close', () => {
    console.log('Клиент отключился');
  });
});

console.log('WebSocket сервер запущен на ws://localhost:8080');

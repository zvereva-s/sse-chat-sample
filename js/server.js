const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');

let clients = [];
let messages = [];
let users = [];

const clientHTML = fs.readFileSync('index.html', 'utf8');
const clientJS = fs.readFileSync('js/app.js', 'utf8');  // или путь к вашему JS файлу

const server = http.createServer((req, res) => {
  let pathname = url.parse(req.url).pathname;

  // Обслуживаем статические файлы (например, index.html, app.js, css)
  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(clientHTML);
  } else if (pathname === '/js/app.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(clientJS);
  } else if (pathname === '/chat') {
    // Обрабатываем GET и POST для чата
    if (req.method === 'GET') {
      acceptNewClient(req, res);
    } else if (req.method === 'POST') {
      broadcastNewMessage(req, res);
    }
  } else {
    // 404 ошибка для неизвестных маршрутов
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(8080, () => {
  console.log('✅ Server is running on http://localhost:8080');
});

// Функция для подключения нового клиента
function acceptNewClient(req, res) {
  clients.push(res);

  req.on('close', () => {
    // Удаляем клиента из списка при отключении
    clients = clients.filter(client => client !== res);
    users = users.filter(user => user.res !== res);
  });

  // Отправляем подключенному клиенту сообщения и список пользователей
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  });

  // Отправляем последние сообщения и список пользователей
  res.write('event: chat\ndata: ' + JSON.stringify({ messages, users }) + '\n\n');
}

// Функция для рассылки сообщений
async function broadcastNewMessage(req, res) {
  req.setEncoding('utf8');
  let body = '';

  // Собираем тело сообщения
  for await (let chunk of req) {
    body += chunk;
  }

  // Добавляем сообщение в список сообщений
  messages.push(body);

  // Рассылаем всем подключенным клиентам новое сообщение
  let message = 'data: ' + JSON.stringify({ message: body, messages, users }) + '\n\n';
  clients.forEach(client => client.write('event: chat\n' + message));

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Message sent');
}

// Функция для обновления списка пользователей (имитирует ввод никнейма)
let nick = 'User' + Math.floor(Math.random() * 1000);
users.push({ nick });

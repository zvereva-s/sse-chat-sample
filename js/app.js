let nick = prompt('Enter your nickname');
let input = document.getElementById('sse-input');
let messagesContainer = document.getElementById('messages');
let usersContainer = document.getElementById('users');

input.focus();

// Создаем подключение для получения событий SSE
let chat = new EventSource('/chat');

chat.addEventListener('chat', e => {
  let data = JSON.parse(e.data);

  // Отображаем сообщения
  messagesContainer.innerHTML = ''; // Очищаем сообщения
  data.messages.forEach(msg => {
    let div = document.createElement('div');
    div.textContent = msg;
    messagesContainer.appendChild(div);
  });

  // Отображаем список пользователей
  usersContainer.innerHTML = ''; // Очищаем список пользователей
  data.users.forEach(user => {
    let div = document.createElement('div');
    div.textContent = user.nick;
    usersContainer.appendChild(div);
  });

  // Прокручиваем вниз
  input.scrollIntoView();
});

// Отправка сообщений
input.addEventListener('change', e => {
  fetch('/chat', {
    method: 'POST',
    body: nick + ': ' + input.value
  }).catch(e => console.log(e));

  input.value = ''; // Очищаем поле ввода
});


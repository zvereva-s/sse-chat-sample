Возможные проблемы и их решения
❌ Проблема 1: БД перегружается (слишком много INSERT-запросов одновременно)
🔴 Что может случиться?
Если у тебя большой файл (например, 1 млн строк), код попытается вставлять строки в БД слишком быстро, и сервер PostgreSQL может не справиться.

✅ Как исправить?
Используй ограничение количества одновременных запросов с помощью библиотеки p-map или Batch INSERT.

📌 Решение 1: Ограничение числа запросов (p-map)
js
Копировать
Редактировать
const pMap = require('p-map');

const transformStream = new Transform({
objectMode: true,
async transform(row, encoding, callback) {
row.name = row.name.toUpperCase();

    // Ограничиваем количество одновременных записей в БД
    await pMap(
      [row], // массив данных (здесь по 1 строке)
      async (item) => {
        await db.query('INSERT INTO users (name, email) VALUES ($1, $2)', [item.name, item.email]);
      },
      { concurrency: 10 } // Одновременно выполняем не больше 10 записей
    );

    callback(null, row);
}
});
👉 Теперь в БД одновременно пишется не более 10 запросов — сервер не перегружается.

📌 Решение 2: Batch INSERT (Вставка пачками)
js
Копировать
Редактировать
const batchSize = 1000;
let buffer = [];

const transformStream = new Transform({
objectMode: true,
async transform(row, encoding, callback) {
row.name = row.name.toUpperCase();
buffer.push(row);

    if (buffer.length >= batchSize) {
      await insertBatch(); // Вставляем пачку в БД
    }

    callback(null, row);
}
});

async function insertBatch() {
if (buffer.length === 0) return;

const values = buffer.map(row => `('${row.name}', '${row.email}')`).join(',');
await db.query(`INSERT INTO users (name, email) VALUES ${values}`);

buffer = []; // Очищаем буфер
}
👉 Теперь мы вставляем данные пачками по 1000 строк вместо 1 запроса на каждую строку — это сильно ускоряет импорт.

❌ Проблема 2: Поток завершился раньше, чем данные записались
🔴 Что может случиться?
Код .on('finish', () => db.end()) закрывает подключение к БД сразу после завершения потока, но могут остаться незавершенные записи.

✅ Как исправить?
Ждем, пока все записи завершатся, прежде чем закрывать подключение:

js
Копировать
Редактировать
const { finished } = require('stream/promises');

(async () => {
const stream = fs.createReadStream('data.csv')
.pipe(csv())
.pipe(transformStream);

await finished(stream); // Ждем завершения всех операций
await insertBatch(); // Вставляем оставшиеся данные
await db.end(); // Закрываем соединение с БД
console.log('Импорт завершен');
})();
👉 Теперь БД закроется только после завершения всех операций.

🔹 Итог: будет ли сервер обрабатывать API-запросы параллельно?
✅ Да, потому что:

Потоки (fs.createReadStream, pipe()) работают асинхронно.
Запросы в PostgreSQL (db.query()) не блокируют Event Loop.
API-запросы в Express/Nest.js могут выполняться параллельно.
⚠️ Но важно не перегружать БД — для этого стоит:

Ограничивать число одновременных запросов (p-map).
Использовать пакетную вставку данных (Batch INSERT).
Ждать завершения всех операций перед db.end().
🚀 Теперь твой сервер сможет одновременно импортировать файл и обрабатывать API-запросы без лагов!

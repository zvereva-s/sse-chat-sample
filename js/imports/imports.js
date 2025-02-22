const fs = require('fs');
const { Transform } = require('stream');
const csv = require('csv-parser');
const { Client } = require('pg'); // Подключаем PostgreSQL

// Подключение к БД
const db = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'mydb',
  password: 'password',
  port: 5432,
});

db.connect();

// Преобразующий поток для обработки строк CSV
const transformStream = new Transform({
  objectMode: true, // Работаем с объектами, а не строками
  transform(row, encoding, callback) {
    // Допустим, хотим привести имена к верхнему регистру
    row.name = row.name.toUpperCase();

    // Запись в базу
    db.query('INSERT INTO users (name, email) VALUES ($1, $2)', [row.name, row.email])
      .then(() => callback(null, row)) // Продолжаем поток
      .catch(err => callback(err)); // Ошибка
  }
});

// Читаем CSV, преобразуем и записываем в БД
fs.createReadStream('data.csv')
  .pipe(csv()) // Читаем CSV и превращаем строки в объекты
  .pipe(transformStream) // Преобразуем данные
  .on('finish', () => {
    console.log('Импорт завершен');
    db.end(); // Закрываем подключение
  })
  .on('error', err => console.error('Ошибка:', err));

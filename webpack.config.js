const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  devServer: {
    proxy: {
      '/chat': 'http://localhost:8080',  // Прокси для запросов на /chat
    },
    static: {
      directory: path.join(__dirname, 'public'),
    },
    port: 5500,  // Порт для фронтенда
    open: true,  // Открывает браузер автоматически
  },
};

# RusTV - Платформа для просмотра российских телеканалов

RusTV - это веб-платформа для просмотра российских телеканалов онлайн. Проект разделен на фронтенд (Vue.js) и бэкенд (Node.js/Express).

## Особенности

- 🖥️ Просмотр российских телеканалов онлайн
- 🔒 Система аутентификации и авторизации
- 💳 Управление подписками
- 📱 Адаптивный дизайн
- 🔍 Поиск и фильтрация каналов

## Техническая информация

### Фронтенд

- **Фреймворк**: Vue 3 с Composition API
- **Управление состоянием**: Pinia
- **Маршрутизация**: Vue Router
- **HTTP-клиент**: Axios
- **Сборка проекта**: Vite
- **Язык программирования**: TypeScript

### Бэкенд

- **Платформа**: Node.js
- **Фреймворк**: Express
- **База данных**: MongoDB с Mongoose
- **Аутентификация**: JWT (JSON Web Tokens)
- **Язык программирования**: TypeScript

## Установка и запуск

### Предварительные требования

- Node.js (v14 или выше)
- MongoDB
- npm или yarn

### Установка

1. Клонируйте репозиторий:

   ```bash
   git clone https://github.com/yourusername/rus-tv.git
   cd rus-tv
   ```

2. Установите зависимости для фронтенда:

   ```bash
   cd frontend
   npm install
   ```

3. Установите зависимости для бэкенда:

   ```bash
   cd ../backend
   npm install
   ```

4. Создайте файл `.env` в директории `backend` со следующими переменными:

   ```
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/rus-tv
   JWT_SECRET=your_jwt_secret_key
   CORS_ORIGIN=http://localhost:5173
   PLAYLIST_URL=http://example.com/playlist.m3u8

   # Email настройки
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your_email@example.com
   EMAIL_PASSWORD=your_email_password
   EMAIL_FROM=RusTV <no-reply@rustv.com>
   ```

### Запуск

1. Запустите MongoDB:

   ```bash
   mongod
   ```

2. Запустите бэкенд:

   ```bash
   cd backend
   npm run build
   npm start
   ```

3. Запустите фронтенд:

   ```bash
   cd frontend
   npm run dev
   ```

4. Откройте в браузере: `http://localhost:5173`

## Процесс регистрации и авторизации

1. **Регистрация**:
   - Пользователь вводит email
   - Система генерирует имя пользователя и пароль
   - Пользователь получает email с данными для входа
2. **Авторизация**:
   - Пользователь входит в систему используя полученное имя пользователя и пароль

## Структура проекта

### Фронтенд

```
frontend/
├── public/             # Статические файлы
├── src/
│   ├── assets/         # Изображения, стили и т.д.
│   ├── components/     # Vue компоненты
│   ├── router/         # Маршрутизация
│   ├── stores/         # Pinia хранилища
│   ├── views/          # Представления (страницы)
│   ├── App.vue         # Корневой компонент
│   └── main.ts         # Точка входа
└── vite.config.ts      # Конфигурация Vite
```

### Бэкенд

```
backend/
├── src/
│   ├── config/         # Конфигурация
│   ├── controllers/    # Контроллеры
│   ├── middleware/     # Промежуточное ПО
│   ├── models/         # Mongoose модели
│   ├── routes/         # Маршруты API
│   ├── services/       # Сервисы
│   ├── types/          # TypeScript типы
│   ├── utils/          # Утилиты
│   └── app.ts          # Точка входа
└── tsconfig.json       # Конфигурация TypeScript
```

## Лицензия

Этот проект распространяется под лицензией MIT.

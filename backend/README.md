# RusTV Backend

Бэкенд-часть проекта RusTV - платформы для просмотра российских телеканалов.

## Технологии

- Node.js
- Express
- MongoDB с Mongoose
- TypeScript
- JWT для аутентификации
- Nodemailer для отправки email

## Структура проекта

```
src/
├── config/         # Конфигурация приложения и переменные окружения
├── controllers/    # Контроллеры для обработки HTTP-запросов
├── middleware/     # Промежуточное ПО (авторизация, валидация и т.д.)
├── models/         # Mongoose модели для работы с MongoDB
├── routes/         # Маршруты API
├── services/       # Бизнес-логика и сервисы
├── types/          # TypeScript типы и интерфейсы
├── utils/          # Вспомогательные утилиты
└── app.ts          # Точка входа в приложение
```

## Основные функции API

### Аутентификация

- `POST /api/auth/register` - Регистрация нового пользователя (требуется только email)
- `POST /api/auth/login` - Вход в систему (требуется username и пароль)
- `GET /api/auth/me` - Получение информации о текущем пользователе
- `POST /api/auth/subscribe` - Управление подпиской

### Плейлист и каналы

- `GET /api/playlist` - Получение списка каналов (требуется авторизация)
- `GET /api/playlist/stream` - Доступ к видеопотоку канала
- `GET /api/playlist/logo` - Получение логотипа канала
- `POST /api/playlist/refresh` - Обновление плейлиста (только для администраторов)

### Управление каналами

- `GET /api/channels` - Получение списка каналов
- `POST /api/channels` - Добавление нового канала (только для администраторов)
- `PUT /api/channels/:id` - Обновление канала (только для администраторов)
- `DELETE /api/channels/:id` - Удаление канала (только для администраторов)

## Переменные окружения

Для работы бэкенда необходимо создать файл `.env` в корне директории со следующими переменными:

```
# Сервер
PORT=3000
NODE_ENV=development

# База данных
MONGODB_URI=mongodb://localhost:27017/rus-tv

# JWT
JWT_SECRET=your_jwt_secret_key
BCRYPT_SALT_ROUNDS=10

# CORS
CORS_ORIGIN=http://localhost:5173

# Плейлист
PLAYLIST_URL=http://example.com/playlist.m3u8
PLAYLIST_UPDATE_INTERVAL=3600000

# Аутентификация
MIN_PASSWORD_LENGTH=6
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=30

# Подписка
TRIAL_DURATION_DAYS=7
TRIAL_DEVICE_LIMIT=2
SUBSCRIPTION_PRICE_PER_DEVICE=3
MIN_DEVICES=1
MAX_DEVICES=5

# Email
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=RusTV <no-reply@rustv.com>
```

## Установка и запуск

1. Установите зависимости:

   ```bash
   npm install
   ```

2. Создайте файл `.env` и настройте переменные окружения

3. Соберите проект:

   ```bash
   npm run build
   ```

4. Запустите сервер:

   ```bash
   npm start
   ```

5. Для разработки:
   ```bash
   npm run dev
   ```

## Процесс разработки

1. Обновление и компиляция TypeScript в реальном времени:

   ```bash
   npm run watch
   ```

2. Запуск сервера с nodemon для автоматической перезагрузки:
   ```bash
   npm run dev
   ```

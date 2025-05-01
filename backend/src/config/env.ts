import dotenv from 'dotenv'
import { Secret } from 'jsonwebtoken'
import path from 'path'

// Загружаем переменные окружения из .env файла
dotenv.config({ path: path.join(__dirname, '../../.env') })

export const config = {
	server: {
		port: process.env.PORT || 3000,
		nodeEnv: process.env.NODE_ENV || 'development',
	},
	db: {
		uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rus-tv',
	},
	jwt: {
		secret: (process.env.JWT_SECRET ||
			'default-secret-key-change-this') as Secret,
		expiresIn: 7 * 24 * 60 * 60, // 7 дней в секундах
	},
	cors: {
		origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
	},
	security: {
		bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
	},
	playlist: {
		url: process.env.PLAYLIST_URL || '',
		updateInterval: parseInt(
			process.env.PLAYLIST_UPDATE_INTERVAL || '3600000',
			10
		), // 1 час по умолчанию
	},
	auth: {
		// Минимальная длина пароля
		minPasswordLength: parseInt(process.env.MIN_PASSWORD_LENGTH || '6', 10),
		// Максимальное количество попыток входа
		maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
		// Время блокировки аккаунта после превышения попыток (в минутах)
		lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '30', 10),
	},
	subscription: {
		// Настройки пробного периода
		trial: {
			duration: parseInt(process.env.TRIAL_DURATION_DAYS || '7', 10), // дней
			deviceLimit: parseInt(process.env.TRIAL_DEVICE_LIMIT || '2', 10), // устройств
		},
		// Стоимость подписки за одно устройство в месяц
		pricePerDevice: parseInt(
			process.env.SUBSCRIPTION_PRICE_PER_DEVICE || '3',
			10
		), // $
		// Минимальное количество устройств
		minDevices: parseInt(process.env.MIN_DEVICES || '1', 10),
		// Максимальное количество устройств
		maxDevices: parseInt(process.env.MAX_DEVICES || '5', 10),
	},
	email: {
		host: process.env.EMAIL_HOST || 'smtp.example.com',
		port: parseInt(process.env.EMAIL_PORT || '587', 10),
		secure: process.env.EMAIL_SECURE === 'true',
		user: process.env.EMAIL_USER || 'user@example.com',
		password: process.env.EMAIL_PASSWORD || 'password',
		from: process.env.EMAIL_FROM || 'RusTV <noreply@rustv.com>',
	},
}

// Проверка наличия необходимых переменных в production
if (config.server.nodeEnv === 'production') {
	const requiredEnvVars = [
		'JWT_SECRET',
		'MONGODB_URI',
		'PLAYLIST_URL',
		'EMAIL_HOST',
		'EMAIL_USER',
		'EMAIL_PASSWORD',
	]
	for (const envVar of requiredEnvVars) {
		if (!process.env[envVar]) {
			throw new Error(
				`Environment variable ${envVar} is required in production mode`
			)
		}
	}
}

export default config

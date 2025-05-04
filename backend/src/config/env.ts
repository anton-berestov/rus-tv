import dotenv from 'dotenv'
import { Secret } from 'jsonwebtoken'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '../../.env') })

export const config = {
	server: {
		port: process.env.PORT || 3001,
		nodeEnv: process.env.NODE_ENV || 'development',
	},
	db: {
		uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rus-tv',
	},
	security: {
		jwt: {
			secret: (process.env.JWT_SECRET ||
				'default-secret-key-change-this') as Secret,
			expiresIn: process.env.JWT_EXPIRES_IN || '30d',
		},
		bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
	},
	cors: {
		origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
	},
	playlist: {
		url: process.env.PLAYLIST_URL || '',
		updateInterval: parseInt(
			process.env.PLAYLIST_UPDATE_INTERVAL || '3600000',
			10
		),
	},
	auth: {
		minPasswordLength: parseInt(process.env.MIN_PASSWORD_LENGTH || '6', 10),
		maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
		lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '30', 10),
	},
	subscription: {
		trial: {
			duration: parseInt(process.env.TRIAL_DURATION_DAYS || '7', 10),
			deviceLimit: parseInt(process.env.TRIAL_DEVICE_LIMIT || '2', 10),
		},
		pricePerDevice: parseInt(
			process.env.SUBSCRIPTION_PRICE_PER_DEVICE || '3',
			10
		),
		minDevices: parseInt(process.env.MIN_DEVICES || '1', 10),
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
	payment: {
		returnUrl:
			process.env.PAYMENT_RETURN_URL || 'http://localhost:5173/subscription',
		webhookUrl:
			process.env.PAYMENT_WEBHOOK_URL ||
			'http://localhost:3001/api/payments/webhook',
		yookassa: {
			shopId: process.env.YOOKASSA_SHOP_ID || '',
			secretKey: process.env.YOOKASSA_SECRET_KEY || '',
			returnUrl:
				process.env.YOOKASSA_RETURN_URL || 'http://localhost:5173/subscription',
			webhookUrl:
				process.env.YOOKASSA_WEBHOOK_URL ||
				'http://localhost:3001/api/yookassa/webhook',
			defaultCurrency: 'RUB',
		},
	},
}

if (config.server.nodeEnv === 'production') {
	const requiredEnvVars = [
		'JWT_SECRET',
		'MONGODB_URI',
		'PLAYLIST_URL',
		'EMAIL_HOST',
		'EMAIL_USER',
		'EMAIL_PASSWORD',
		'PAYMENT_RETURN_URL',
		'YOOKASSA_SHOP_ID',
		'YOOKASSA_SECRET_KEY',
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
